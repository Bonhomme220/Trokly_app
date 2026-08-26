<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|image|max:8192',
        ]);

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');

        // Clé objet : uploads/AAAA/MM/uuid.ext (l'extension permet à Flysystem
        // de déduire le bon Content-Type pour l'affichage navigateur).
        $path = 'uploads/' . date('Y/m') . '/' . Str::uuid()->toString() . '.' . $ext;

        try {
            Storage::disk('r2')->put(
                $path,
                file_get_contents($file->getRealPath())
            );
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Erreur lors de l\'upload.'], 500);
        }

        return response()->json([
            'url' => Storage::disk('r2')->url($path),
        ]);
    }
}
