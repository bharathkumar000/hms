/// Central app configuration.
///
/// Supabase credentials are read from `--dart-define` flags first (so they are
/// never committed), then fall back to the hospital project values used by the
/// web portal (see `/supabase/.env.example` in the repo).
library;

class AppConfig {
  AppConfig._();

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://kxaynqnvsupzxfnlylga.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YXlucW52c3Vwenhmbmx5bGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjM5NDEsImV4cCI6MjEwMTQ5OTk0MX0.qt_EVc3LyCxGMZmOdTiIjLHFWESozNlYrMQ61btsDUA',
  );

  static const String hospitalName = 'City General Hospital';

  static const String currencySymbol = '\u20B9';
}