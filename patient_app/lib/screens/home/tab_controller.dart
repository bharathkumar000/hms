import 'package:flutter/foundation.dart';

/// Global bottom-tab controller shared between the home shell and screens
/// that want to switch tabs (e.g. Dashboard quick-access cards).
final ValueNotifier<int> shellTab = ValueNotifier<int>(0);

int shellTabOf(String screen) {
  switch (screen) {
    case 'appointments':
      return 1;
    case 'canteen':
      return 2;
    case 'records':
      return 3;
    case 'profile':
      return 4;
    default:
      return 0;
  }
}