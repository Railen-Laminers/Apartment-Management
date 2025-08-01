<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Traits\HandlesApiExceptions;

class NotificationController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        return $this->safeCall(function () use ($request) {
            $notifications = $request->user()
                ->notificationsLog()
                ->latest()
                ->get();

            return response()->json($notifications);
        }, 'Fetching user notifications', [
            'user_id' => optional($request->user())->id,
        ]);
    }
}
