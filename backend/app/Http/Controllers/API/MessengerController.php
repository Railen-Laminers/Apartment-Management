<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Traits\HandlesApiExceptions;

class MessengerController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Authenticated user: generate Messenger linking code
     */
    public function generateCode()
    {
        return $this->safeCall(function () {
            $user = auth()->user();

            // Ensure code is unique
            do {
                $code = strtoupper(Str::random(6));
            } while (User::where('messenger_link', $code)->exists());

            $user->messenger_link = $code;
            $user->save();

            return response()->json([
                'code' => $code,
                'instructions' => "Message our Facebook page with this code to link Messenger: {$code}",
                'messenger_page_url' => env('FB_PAGE_LINK'),
            ]);
        }, 'Generating Messenger link code', [
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Facebook webhook verification
     */
    public function verify(Request $request)
    {
        $verifyToken = env('FB_VERIFY_TOKEN');

        try {
            if (
                $request->get('hub_mode') === 'subscribe' &&
                $request->get('hub_verify_token') === $verifyToken
            ) {
                return response($request->get('hub_challenge'), 200);
            }

            \Log::warning('Facebook Webhook verification failed', [
                'payload' => $request->all(),
            ]);

            return response('Invalid verification token', 403);
        } catch (\Throwable $e) {
            \Log::error('Error during Facebook webhook verification', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all(),
            ]);

            return response('Server Error', 500);
        }
    }


    /**
     * Handle Facebook webhook messages
     */
    public function handle(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            foreach ($request->input('entry', []) as $entry) {
                foreach ($entry['messaging'] ?? [] as $event) {
                    $psid = $event['sender']['id'] ?? null;
                    $text = strtoupper(trim($event['message']['text'] ?? ''));

                    if ($psid && $text) {
                        $user = User::where('messenger_link', $text)->first();

                        if ($user) {
                            $user->messenger_psid = $psid;
                            $user->messenger_link = null;
                            $user->save();

                            // Send confirmation back
                            Http::post(
                                "https://graph.facebook.com/v18.0/me/messages?access_token="
                                . env('FB_PAGE_ACCESS_TOKEN'),
                                [
                                    'recipient' => ['id' => $psid],
                                    'message' => ['text' => "✅ Your Messenger is now linked. You'll receive updates here."],
                                ]
                            );
                        }
                    }
                }
            }

            return response()->json(['status' => 'received']);
        }, 'Handling Facebook webhook', [
            'payload' => $request->all(),
        ]);
    }
}
