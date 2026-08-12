import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Authenticates patients against the Supabase backend shared with the
/// hospital's web portal. Session persistence is handled by supabase_flutter
/// automatically.
class AuthService {
  static SharedPreferences? _prefs;
  static const String _rememberMeKey = 'patient_remember_me';
  static const String _savedEmailKey = 'patient_saved_email';

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SupabaseClient get _client => Supabase.instance.client;

  static User? get currentUser => _client.auth.currentUser;

  static String? get currentUserId => currentUser?.id;

  static Future<bool> login(String email, String password) async {
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
      return _client.auth.currentUser != null;
    } on AuthException {
      return false;
    }
  }

  static Future<void> logout() async {
    try {
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

  static bool isLoggedIn() => _client.auth.currentSession != null;

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