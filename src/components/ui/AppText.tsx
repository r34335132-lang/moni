import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Font, Type, familyForWeight } from '@/constants/typography';

export { Font, Type };

type AppTextProps = TextProps & {
  variant?: keyof typeof Type;
};

/** Prefer this for UI text — readable sizes + correct font files. */
export function AppText({ variant = 'body', style, ...props }: AppTextProps) {
  const base = Type[variant];
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const family = flat?.fontFamily ?? familyForWeight(flat?.fontWeight) ?? base.fontFamily;
  // When callers bump fontSize without lineHeight, drop base lineHeight so digits aren't clipped
  const sizeOverride = flat?.fontSize != null && flat.fontSize !== base.fontSize;
  const resolvedBase: TextStyle =
    sizeOverride && flat?.lineHeight == null
      ? { ...base, lineHeight: Math.round(Number(flat.fontSize) * 1.2) }
      : base;

  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={1.4}
      {...props}
      style={[resolvedBase, style, { fontFamily: family }]}
    />
  );
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const family = flat?.fontFamily ?? familyForWeight(flat?.fontWeight);
  return (
    <RNTextInput
      allowFontScaling
      maxFontSizeMultiplier={1.4}
      {...props}
      style={[{ fontFamily: Font.regular, fontSize: 17, letterSpacing: -0.15 }, style, { fontFamily: family }]}
    />
  );
}

/**
 * Makes every Text / TextInput use Plus Jakarta Sans with readable defaults.
 * Maps fontWeight → correct font file (needed on Android).
 */
export function installGlobalTypography() {
  const patch = (Component: typeof RNText | typeof RNTextInput, isInput: boolean) => {
    const Comp = Component as typeof RNText & {
      render?: (...args: unknown[]) => React.ReactElement;
      defaultProps?: Record<string, unknown>;
      __moniTypography?: boolean;
    };
    if (Comp.defaultProps == null) Comp.defaultProps = {};
    Comp.defaultProps.allowFontScaling = true;
    Comp.defaultProps.maxFontSizeMultiplier = 1.4;

    const originalRender = Comp.render;
    if (!originalRender || Comp.__moniTypography) return;
    Comp.__moniTypography = true;

    Comp.render = function renderWithTypography(this: unknown, ...args: unknown[]) {
      const origin = originalRender.apply(this, args as never) as React.ReactElement<{
        style?: StyleProp<TextStyle>;
      }>;
      const flat = StyleSheet.flatten(origin.props.style) as TextStyle | undefined;
      const family = flat?.fontFamily ?? familyForWeight(flat?.fontWeight);
      const defaults: TextStyle = isInput
        ? { fontFamily: family, fontSize: flat?.fontSize ?? 17, letterSpacing: flat?.letterSpacing ?? -0.15 }
        : { fontFamily: family, letterSpacing: flat?.letterSpacing ?? -0.15 };

      return React.cloneElement(origin, {
        style: [defaults, origin.props.style, { fontFamily: family }],
      });
    };
  };

  patch(RNText, false);
  patch(RNTextInput, true);
}
