<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Application Commands
|--------------------------------------------------------------------------
*/
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Subscription Expiry Scheduler
|--------------------------------------------------------------------------
| Every day at midnight, mark any ended subscriptions as expired.
|--------------------------------------------------------------------------
*/
Schedule::command('subscriptions:expire')
    ->daily()
    ->withoutOverlapping()
    ->onOneServer()
    ->description('Expire past-due subscriptions');

/*
|--------------------------------------------------------------------------
| Rent Due Notification Scheduler
|--------------------------------------------------------------------------
| Sends rent reminders 3 days before and on due date
|--------------------------------------------------------------------------
*/
Schedule::command('notify:rent-due')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->description('Send rent due notifications 3 days before and on the due date');


/*
|--------------------------------------------------------------------------
| Lease Expiry Scheduler
|--------------------------------------------------------------------------
| 
|--------------------------------------------------------------------------
*/
Schedule::command('leases:expire')
    ->dailyAt('07:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->description('Send lease expiry reminders and expire leases.');
