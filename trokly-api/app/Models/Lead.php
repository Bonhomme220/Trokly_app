<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'full_name',
        'phone_number',
        'profile',
        'city',
        'has_iphone_to_sell',
    ];
}
