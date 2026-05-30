<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\TradeController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\BoostController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\Admin\AdminListingController;
use App\Http\Controllers\Api\Admin\AdminExpertiseController;
use App\Http\Controllers\Api\Admin\AdminTransactionController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminDeliveryController;
use App\Http\Controllers\Api\Admin\AdminLitigationController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminAmbassadorController;
use App\Http\Controllers\Api\AmbassadorController;
use Illuminate\Support\Facades\Route;

// Leads pré-lancement (public)
Route::post('leads', [LeadController::class, 'store']);
Route::get('leads', [LeadController::class, 'index'])->middleware(['auth:sanctum', 'role:admin|super_admin']);

// Auth
Route::prefix('auth')->group(function () {
    Route::post('otp/send', [OtpController::class, 'send']);
    Route::post('otp/verify', [OtpController::class, 'verify']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

// Routes publiques (marketplace consultable sans compte)
Route::get('listings', [ListingController::class, 'index']);
Route::get('listings/{listing}', [ListingController::class, 'show']);
Route::get('sellers/{sellerId}', [ListingController::class, 'sellerProfile']);

// Webhook PayPlus (public, appelé par PayPlus)
Route::post('payments/webhook', [PaymentController::class, 'webhook']);

// Code ambassadeur (public — vérification avant paiement)
Route::get('ambassador/codes/{code}/check', [AmbassadorController::class, 'checkCode']);

// Routes authentifiées
Route::middleware('auth:sanctum')->group(function () {

    // Upload Cloudinary
    Route::post('upload', [UploadController::class, 'store']);

    // KYC
    Route::post('kyc', [KycController::class, 'submit']);
    Route::get('kyc/status', [KycController::class, 'status']);

    // Annonces (actions)
    Route::post('listings', [ListingController::class, 'store']);
    Route::put('listings/{listing}', [ListingController::class, 'update']);
    Route::delete('listings/{listing}', [ListingController::class, 'destroy']);
    Route::post('listings/{listing}/mark-sold', [ListingController::class, 'markSold']);
    Route::post('listings/{listing}/boost', [BoostController::class, 'store']);

    // Paiement annonces
    Route::post('payments/{listing}/initiate', [PaymentController::class, 'initiate']);
    Route::get('payments/verify', [PaymentController::class, 'verify']);

    // Mes annonces
    Route::get('my/listings', [ListingController::class, 'myListings']);
    Route::get('my/listings/{listing}', [ListingController::class, 'showMine']);
    Route::post('listings/{listing}/republish', [ListingController::class, 'republish']);
    Route::get('my/purchases', [TransactionController::class, 'myPurchases']);
    Route::get('my/sales', [TransactionController::class, 'mySales']);

    // Transactions
    Route::post('transactions', [TransactionController::class, 'store']);
    Route::get('transactions/{transaction}', [TransactionController::class, 'show']);
    Route::post('transactions/{transaction}/retract', [TransactionController::class, 'retract']);

    // Troc
    Route::get('my/trades', [TradeController::class, 'myTrades']);
    Route::post('trades', [TradeController::class, 'store']);
    Route::get('trades/{trade}', [TradeController::class, 'show']);
    Route::post('trades/{trade}/offers', [TradeController::class, 'makeOffer']);
    Route::post('trades/{trade}/offers/{offer}/accept', [TradeController::class, 'acceptOffer']);
    Route::post('trades/{trade}/offers/{offer}/refuse', [TradeController::class, 'refuseOffer']);
    Route::post('trades/{trade}/withdraw', [TradeController::class, 'withdraw']);

    // Portefeuille
    Route::get('wallet', [WalletController::class, 'show']);
    Route::get('wallet/transactions', [WalletController::class, 'transactions']);
    Route::post('wallet/withdraw', [WalletController::class, 'withdraw']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Ambassador
    Route::prefix('ambassador')->group(function () {
        Route::get('me', [AmbassadorController::class, 'me']);
        Route::get('earnings', [AmbassadorController::class, 'earnings']);
        Route::post('withdraw', [AmbassadorController::class, 'withdraw']);
    });

    // Admin
    Route::prefix('admin')->middleware('role:admin|super_admin')->group(function () {
        Route::get('dashboard', [AdminDashboardController::class, 'index']);
        Route::get('stats', [AdminDashboardController::class, 'stats']);
        Route::get('sellers', [AdminDashboardController::class, 'sellers']);

        // Utilisateurs
        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('users/{user}', [AdminUserController::class, 'show']);
        Route::post('users/{user}/toggle-active', [AdminUserController::class, 'toggleActive']);
        Route::post('users/{user}/kyc/approve', [AdminUserController::class, 'approveKyc']);
        Route::post('users/{user}/kyc/reject', [AdminUserController::class, 'rejectKyc']);
        Route::post('users/{user}/credits', [AdminUserController::class, 'giveCredits']);

        // Staff (super_admin seulement)
        Route::get('staff', [AdminUserController::class, 'staff'])->middleware('role:super_admin');
        Route::post('staff', [AdminUserController::class, 'createStaff'])->middleware('role:super_admin');

        // Profil expert partenaire
        Route::put('staff/{user}/expert-profile', [AdminUserController::class, 'updateExpertProfile'])->middleware('role:super_admin');

        // Annonces
        Route::get('listings', [AdminListingController::class, 'index']);
        Route::post('listings/{listing}/publish', [AdminListingController::class, 'publish']);
        Route::post('listings/{listing}/unpublish', [AdminListingController::class, 'unpublish']);
        Route::post('listings/{listing}/reject', [AdminListingController::class, 'reject']);
        Route::delete('listings/{listing}', [AdminListingController::class, 'destroy']);

        // Expertises
        Route::get('expertises', [AdminExpertiseController::class, 'index']);
        Route::get('expertises/{expertise}', [AdminExpertiseController::class, 'show']);
        Route::post('expertises/{listing}/assign', [AdminExpertiseController::class, 'assign']);
        Route::post('expertises/{expertise}/validate', [AdminExpertiseController::class, 'validate']);
        Route::post('expertises/{expertise}/reject', [AdminExpertiseController::class, 'reject']);
        Route::post('quick-sale/{listing}/decide', [AdminExpertiseController::class, 'quickSaleDecide']);

        // Transactions
        Route::get('transactions', [AdminTransactionController::class, 'index']);
        Route::get('transactions/{transaction}', [AdminTransactionController::class, 'show']);
        Route::post('transactions/{transaction}/release', [AdminTransactionController::class, 'release']);

        // Livraisons
        Route::get('deliveries', [AdminDeliveryController::class, 'index']);
        Route::post('deliveries/{transaction}/assign', [AdminDeliveryController::class, 'assign']);
        Route::post('deliveries/{delivery}/status', [AdminDeliveryController::class, 'updateStatus']);

        // Litiges
        Route::get('litigations', [AdminLitigationController::class, 'index']);
        Route::get('litigations/{litigation}', [AdminLitigationController::class, 'show']);
        Route::post('litigations/{litigation}/resolve', [AdminLitigationController::class, 'resolve']);

        // Ambassadeurs
        Route::get('ambassadors', [AdminAmbassadorController::class, 'index']);
        Route::post('ambassadors', [AdminAmbassadorController::class, 'store']);
        Route::put('ambassadors/{code}', [AdminAmbassadorController::class, 'update']);
        Route::put('ambassadors/{code}/toggle', [AdminAmbassadorController::class, 'toggle']);
        Route::get('ambassador-withdrawals', [AdminAmbassadorController::class, 'withdrawals']);
        Route::post('ambassador-withdrawals/{withdrawal}/approve', [AdminAmbassadorController::class, 'approveWithdrawal']);
        Route::post('ambassador-withdrawals/{withdrawal}/reject', [AdminAmbassadorController::class, 'rejectWithdrawal']);
    });

    // Expert
    Route::prefix('expert')->middleware('role:expert|admin|super_admin')->group(function () {
        Route::get('queue', [AdminExpertiseController::class, 'queue']);
        Route::post('expertises/{listing}/start', [AdminExpertiseController::class, 'start']);
        Route::put('expertises/{expertise}', [AdminExpertiseController::class, 'update']);
    });

    // Livreur
    Route::prefix('delivery')->middleware('role:delivery_agent|admin|super_admin')->group(function () {
        Route::get('my-deliveries', [AdminDeliveryController::class, 'myDeliveries']);
        Route::post('deliveries/{delivery}/pickup', [AdminDeliveryController::class, 'confirmPickup']);
        Route::post('deliveries/{delivery}/pickup-check', [AdminDeliveryController::class, 'pickupCheck']);
        Route::post('deliveries/{delivery}/deliver', [AdminDeliveryController::class, 'confirmDelivery']);
    });
});
