<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactInfoController extends Controller
{
    public function index(Request $request)
    {
        try {
            $active = $request->query('active');

            $query = DB::table('contact_info')->whereRaw('1=1');

            if ($active !== null && $active !== '') {
                $query->where('is_active', $active === 'true' || $active === 1 || $active === '1');
            }

            $contact = $query
                ->orderByDesc('created_at')
                ->first();

            if (!$contact) {
                return response()->json(null);
            }

            return response()->json($contact);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $email = $request->input('email');
            $whatsapp = $request->input('whatsapp');
            $description = $request->input('description');
            $telegramUrl = $request->input('telegram_url');
            $tiktokUrl = $request->input('tiktok_url');
            $instagramUrl = $request->input('instagram_url');
            $facebookUrl = $request->input('facebook_url');
            $isActive = $request->input('is_active', true);

            if (!$email || !$whatsapp) {
                return response()->json(['error' => 'Email and WhatsApp are required'], 400);
            }

            DB::table('contact_info')
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $nullIfEmpty = function ($v) {
                if ($v === null || $v === '') {
                    return null;
                }
                $s = trim((string) $v);

                return $s === '' ? null : $s;
            };

            $id = DB::table('contact_info')->insertGetId([
                'email' => $email,
                'whatsapp' => $whatsapp,
                'description' => $description ?: null,
                'telegram_url' => $nullIfEmpty($telegramUrl),
                'tiktok_url' => $nullIfEmpty($tiktokUrl),
                'instagram_url' => $nullIfEmpty($instagramUrl),
                'facebook_url' => $nullIfEmpty($facebookUrl),
                'is_active' => (bool) $isActive,
            ]);

            return response()->json([
                'id' => $id,
                'message' => 'Contact info created successfully',
            ], 201);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function update($id, Request $request)
    {
        try {
            $email = $request->input('email');
            $whatsapp = $request->input('whatsapp');
            $description = $request->input('description');
            $telegramUrl = $request->input('telegram_url');
            $tiktokUrl = $request->input('tiktok_url');
            $instagramUrl = $request->input('instagram_url');
            $facebookUrl = $request->input('facebook_url');
            $isActive = $request->input('is_active');

            $updates = [];

            $nullIfEmpty = function ($v) {
                if ($v === null) {
                    return null;
                }
                $s = trim((string) $v);

                return $s === '' ? null : $s;
            };

            if ($email !== null) {
                $updates['email'] = $email;
            }

            if ($whatsapp !== null) {
                $updates['whatsapp'] = $whatsapp;
            }

            if ($description !== null) {
                $updates['description'] = $description;
            }

            if ($telegramUrl !== null) {
                $updates['telegram_url'] = $nullIfEmpty($telegramUrl);
            }

            if ($tiktokUrl !== null) {
                $updates['tiktok_url'] = $nullIfEmpty($tiktokUrl);
            }

            if ($instagramUrl !== null) {
                $updates['instagram_url'] = $nullIfEmpty($instagramUrl);
            }

            if ($facebookUrl !== null) {
                $updates['facebook_url'] = $nullIfEmpty($facebookUrl);
            }

            if ($isActive !== null) {
                $activeBool = (bool) $isActive;
                if ($activeBool) {
                    DB::table('contact_info')
                        ->where('id', '!=', $id)
                        ->update(['is_active' => false]);
                }
                $updates['is_active'] = $activeBool;
            }

            if (!empty($updates)) {
                DB::table('contact_info')
                    ->where('id', $id)
                    ->update($updates);
            }

            return response()->json(['message' => 'Contact info updated successfully']);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::table('contact_info')
                ->where('id', $id)
                ->delete();

            return response()->json(['message' => 'Contact info deleted successfully']);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}

