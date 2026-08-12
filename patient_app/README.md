# Patient Portal Mobile App

Flutter mobile app for the Hospital Management System - **Patient Login** module.

## Features

- **Patient Login** with ID / UHID / Email and password
- Form validation with inline error messages
- Show/hide password toggle
- "Remember Me" persistence via `shared_preferences`
- Session persistence (stays logged in across app restarts)
- Demo authentication matching the web app
- Animated login screen
- Placeholder dashboard with bottom navigation

## Demo Credentials

| Field    | Value |
|----------|-------|
| Login ID | `1`   |
| Password | `1`   |

## Tech Stack

- Dart / Flutter
- `google_fonts` - Inter font
- `shared_preferences` - local storage
- `http` - future API integration (Supabase)

## Project Structure

```
lib/
├── main.dart                    # App entry, theme
├── screens/
│   ├── login_screen.dart        # Patient login UI
│   └── dashboard_screen.dart    # Post-login dashboard (placeholder)
└── services/
    └── auth_service.dart        # Demo auth + session persistence
```

## Setup & Run

```bash
# Requires Flutter SDK (https://docs.flutter.dev/get-started/install)
cd patient_app
flutter pub get
flutter run
```

## Connecting to Backend

The current `AuthService` uses local demo credentials (`1`/`1`) to mirror the web app.
To wire up real authentication with the Supabase backend used by the web app:

1. Add `supabase_flutter` to `pubspec.yaml`
2. Create `.env` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Replace the body of `AuthService.login()` with a `supabase.auth.signInWithPassword(...)` call

## Android build notes

Android platform files are not committed. Generate them with:

```bash
flutter create --platforms=android --org com.example .
```

Then `flutter run` on a device/emulator.
