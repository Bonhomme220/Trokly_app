<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'brevo' => [
        'key' => env('BREVO_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ai' => [
        'url' => env('AI_SERVICE_URL', 'http://localhost:8001'),
    ],

    'cloudinary' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME', 'di5yktbll'),
        'api_key'    => env('CLOUDINARY_API_KEY', '716325859162172'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
    ],

    'payplus' => [
        'api_key' => env('PAYPLUS_API_KEY'),
        'secret_key' => env('PAYPLUS_SECRET_KEY'),
        'base_url' => env('PAYPLUS_BASE_URL', 'https://api.payplus.africa'),
    ],

];
