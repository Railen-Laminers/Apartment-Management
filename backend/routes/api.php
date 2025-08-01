<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PlanController;
use App\Http\Controllers\API\SubscriptionController;
use App\Http\Controllers\API\SubscriptionPaymentController;
use App\Http\Controllers\API\PropertyController;
use App\Http\Controllers\API\UnitController;
use App\Http\Controllers\API\LeaseController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\TermsTemplateController;
use App\Http\Controllers\API\TermsAgreementController;
use App\Http\Controllers\API\FinancialRecordController;
use App\Http\Controllers\API\ServiceRequestController;
use App\Http\Controllers\API\MessengerController;
use App\Http\Middleware\RoleMiddleware;

use App\Http\Controllers\API\AdminLandlordController;
use App\Http\Controllers\API\LandlordTenantController;

use App\Http\Controllers\NotificationController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Public: list all active plans
Route::get('plans', [PlanController::class, 'index']);

Route::get('/webhook/messenger', [MessengerController::class, 'verify']);
Route::post('/webhook/messenger', [MessengerController::class, 'handle']);

/*
|--------------------------------------------------------------------------
| Private Routes (requires Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // ======================
    // COMMON AUTHENTICATED
    // ======================
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::put('auth/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('messenger/generate-code', [MessengerController::class, 'generateCode']);

    Route::get('notifications', [NotificationController::class, 'index']);
    /*
    |--------------------------------------------------------------------------
    | Tenant-only Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(RoleMiddleware::class . ':tenant')->group(function () {
        // View your leases
        Route::get('leases', [LeaseController::class, 'indexTenant']);
        // View & submit your payments
        Route::get('payments', [PaymentController::class, 'indexTenant']);
        Route::post('payments', [PaymentController::class, 'store']);

        // Terms agreements
        Route::get('terms/available', [TermsAgreementController::class, 'availableTemplates']);

        Route::get('terms/agreements', [TermsAgreementController::class, 'index']);
        Route::post('terms/agreements', [TermsAgreementController::class, 'store']);

        // Service Requests (tenant)
        Route::get('tenant/service-requests', [ServiceRequestController::class, 'indexTenant']);
        Route::post('tenant/service-requests', [ServiceRequestController::class, 'store']);

    });


    /*
    |--------------------------------------------------------------------------
    | Landlord-only Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(RoleMiddleware::class . ':landlord')->group(function () {
        // Register a tenant
        Route::post('tenant/register', [AuthController::class, 'registerTenant']);
        Route::get('tenants', [LandlordTenantController::class, 'index']);
        Route::get('tenants/{id}', [LandlordTenantController::class, 'show']);
        Route::put('tenants/{id}', [LandlordTenantController::class, 'update']);
        Route::delete('tenants/{id}', [LandlordTenantController::class, 'destroy']);

        // Subscriptions (view, create)
        Route::get('subscriptions', [SubscriptionController::class, 'index']);
        Route::post('subscriptions', [SubscriptionController::class, 'subscribe']);
        Route::delete('subscriptions/{id}', [SubscriptionController::class, 'destroy']);

        // Subscription payments
        Route::get('subscription-payments/history', [SubscriptionPaymentController::class, 'landlordHistory']);

        Route::get('subscription-payments', [SubscriptionPaymentController::class, 'index']);
        Route::post('subscription-payments', [SubscriptionPaymentController::class, 'store']);

        // Properties CRUD
        Route::apiResource('properties', PropertyController::class);

        // Nested Units CRUD under properties
        Route::get('properties/{property}/units', [UnitController::class, 'index']);
        Route::post('properties/{property}/units', [UnitController::class, 'store']);
        Route::get('properties/{property}/units/{unit}', [UnitController::class, 'show']);
        Route::put('properties/{property}/units/{unit}', [UnitController::class, 'update']);
        Route::delete('properties/{property}/units/{unit}', [UnitController::class, 'destroy']);

        // Leases on your units
        Route::get('leases/all', [LeaseController::class, 'indexLandlord']);
        Route::post('leases', [LeaseController::class, 'store']);
        Route::patch('leases/{id}/status', [LeaseController::class, 'updateStatus']);
        Route::delete('leases/{id}', [LeaseController::class, 'destroy']);


        // Review tenant payments
        Route::get('payments/all', [PaymentController::class, 'indexLandlord']);
        Route::patch('payments/{id}/review', [PaymentController::class, 'review']);

        // Service Request
        Route::get('service-requests', [ServiceRequestController::class, 'indexLandlord']);
        Route::patch('service-requests/{id}/status', [ServiceRequestController::class, 'updateStatus']);

        // Terms templates
        Route::get('terms/templates', [TermsTemplateController::class, 'index']);
        Route::post('terms/templates', [TermsTemplateController::class, 'store']);
        Route::patch('terms/templates/{id}', [TermsTemplateController::class, 'update']);
        Route::delete('terms/templates/{id}', [TermsTemplateController::class, 'destroy']);
    });


    /*
    |--------------------------------------------------------------------------
    | Admin-only Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(RoleMiddleware::class . ':admin')->group(function () {

        Route::get('admin/landlords', [AdminLandlordController::class, 'index']);
        Route::get('admin/landlords/{id}', [AdminLandlordController::class, 'show']);

        // Plan Management
        Route::get('admin/plans', [PlanController::class, 'all']);
        Route::post('admin/plans', [PlanController::class, 'store']);
        Route::get('admin/plans/{id}', [PlanController::class, 'show']);
        Route::put('admin/plans/{id}', [PlanController::class, 'update']);
        Route::delete('admin/plans/{id}', [PlanController::class, 'destroy']);

        Route::get('admin/subscriptions', [SubscriptionController::class, 'all']);

        // Activate landlord subscriptions
        Route::post('subscriptions/{id}/activate', [SubscriptionController::class, 'activate']);

        // Approve/reject subscription payments
        Route::get('admin/subscription-payments', [SubscriptionPaymentController::class, 'allPaymentsForAdmin']);

        Route::post('subscription-payments/{id}/approve', [SubscriptionPaymentController::class, 'approve']);
        Route::post('subscription-payments/{id}/reject', [SubscriptionPaymentController::class, 'reject']);

    });

    // ================================
// SHARED: Landlord + Admin Routes
// ================================
    Route::middleware(RoleMiddleware::class . ':landlord,admin')->group(function () {

        // Financial Records CRUD & Summary
        Route::get('financial-records/summary', [FinancialRecordController::class, 'summary']);
        Route::get('financial-records', [FinancialRecordController::class, 'index']);
        Route::post('financial-records', [FinancialRecordController::class, 'store']);
        Route::get('financial-records/{id}', [FinancialRecordController::class, 'show']);
        Route::put('financial-records/{id}', [FinancialRecordController::class, 'update']);
        Route::delete('financial-records/{id}', [FinancialRecordController::class, 'destroy']);

    });
});
