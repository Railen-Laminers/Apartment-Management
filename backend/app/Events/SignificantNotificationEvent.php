<?php

namespace App\Events;

use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;

class SignificantNotificationEvent
{
    use Dispatchable, SerializesModels;

    public $user_id;
    public $subject;
    public $message;

    public function __construct(int $user_id, string $subject, string $message)
    {
        $this->user_id = $user_id;
        $this->subject = $subject;
        $this->message = $message;
    }
}

