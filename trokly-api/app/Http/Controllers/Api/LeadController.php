<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'full_name'          => 'required|string|max:100',
            'phone_number'       => 'required|string|max:20',
            'profile'            => 'required|in:buyer,seller,both',
            'city'               => 'required|string|max:60',
            'has_iphone_to_sell' => 'boolean',
        ]);

        $lead = Lead::create($request->only([
            'full_name', 'phone_number', 'profile', 'city', 'has_iphone_to_sell',
        ]));

        return response()->json([
            'message' => 'Inscription enregistrée.',
            'lead'    => $lead,
        ], 201);
    }

    public function index(): JsonResponse
    {
        $leads = Lead::orderBy('created_at', 'desc')->get();

        return response()->json([
            'total' => $leads->count(),
            'data'  => $leads,
        ]);
    }
}
