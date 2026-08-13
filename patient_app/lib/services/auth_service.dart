import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Authenticates patients against the Supabase backend shared with the
/// hospital's web portal. Session persistence is handled by supabase_flutter
/// automatically.
class AuthService {
  static SharedPreferences? _prefs;
  static const String _rememberMeKey = 'patient_remember_me';
  static const String _savedEmailKey = 'patient_saved_email';
  static const String _mockAuthTokenKey = 'patient_mock_auth_token';

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SupabaseClient get _client => Supabase.instance.client;

  static User? get currentUser {
    final mockToken = _prefs?.getString(_mockAuthTokenKey);
    if (mockToken != null) {
      return User(
        id: '11111111-1111-1111-1111-111111111111',
        appMetadata: const {},
        userMetadata: const {},
        aud: 'authenticated',
        createdAt: DateTime.now().toIso8601String(),
        email: 'demo@patient.com',
      );
    }
    return _client.auth.currentUser;
  }

  static String? get currentUserId => currentUser?.id;

  /// Demo credentials matching the web portal (`ID 1 / password 1`).
  /// These map to a dedicated Supabase demo patient so RLS + realtime work
  /// normally. Create the account by running
  /// `supabase/create_demo_patient.sql` in the SQL editor once.
  static const String demoLoginId = '1';
  static const String demoLoginPass = '1';
  static const String demoEmail = 'demo@patient.com';

  static bool isDemoCredentials(String login, String password) =>
      login.trim() == demoLoginId && password == demoLoginPass;

  static Future<bool> login(String emailOrId, String password) async {
    try {
      if (isDemoCredentials(emailOrId, password)) {
        await _prefs?.setString(_mockAuthTokenKey, 'patient_demo_authenticated_${DateTime.now().millisecondsSinceEpoch}');
        return true;
      }
      final email = emailOrId.trim();
      await _client.auth.signInWithPassword(email: email, password: password);
      return _client.auth.currentUser != null;
    } on AuthException {
      return false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> logout() async {
    try {
      await _prefs?.remove(_mockAuthTokenKey);
      await _client.auth.signOut();
    } catch (_) {
      // Ignore sign-out errors (e.g. no network); local session is cleared.
    }
  }

  static Future<bool> changePassword(String newPassword) async {
    try {
      await _client.auth.updateUser(UserAttributes(password: newPassword));
      return true;
    } on AuthException {
      return false;
    }
  }

  static bool isLoggedIn() {
    final mockToken = _prefs?.getString(_mockAuthTokenKey);
    if (mockToken != null) return true;
    return _client.auth.currentSession != null;
  }

  static Future<void> setRememberMe(bool remember, {String? email}) async {
    await _prefs?.setBool(_rememberMeKey, remember);
    if (remember && email != null) {
      await _prefs?.setString(_savedEmailKey, email);
    } else if (!remember) {
      await _prefs?.remove(_savedEmailKey);
    }
  }

  static bool getRememberMe() => _prefs?.getBool(_rememberMeKey) ?? false;

  static String? getSavedEmail() => _prefs?.getString(_savedEmailKey);

  static Future<void> clearSavedCredentials() async {
    await _prefs?.remove(_rememberMeKey);
    await _prefs?.remove(_savedEmailKey);
  }
}