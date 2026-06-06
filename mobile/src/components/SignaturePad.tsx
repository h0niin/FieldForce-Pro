import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import SignatureCanvas, { type SignatureViewRef } from 'react-native-signature-canvas';
import { colors, borderRadius } from '@/theme';

export interface SignaturePadHandle {
  clear: () => void;
  save: () => void;
}

interface SignaturePadProps {
  /** Called with the base64/data-URI string when the signature is confirmed. */
  onSave: (signature: string) => void;
  /** Called the moment the user starts drawing. */
  onBegin?: () => void;
  /** Called after the canvas is cleared programmatically. */
  onClear?: () => void;
  /** Explicit pixel height for the canvas — measure with onLayout. */
  height: number;
}

/**
 * A signature canvas that the parent fully controls via a ref.
 * Internal WebView buttons are hidden; the parent renders its own native buttons
 * and calls `ref.clear()` / `ref.save()` directly.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ onSave, onBegin, onClear, height }, ref) => {
    const canvasRef = useRef<SignatureViewRef>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        canvasRef.current?.clearSignature();
        onClear?.();
      },
      save: () => {
        canvasRef.current?.readSignature();
      },
    }));

    return (
      <View style={[styles.container, { height }]}>
        <SignatureCanvas
          ref={canvasRef}
          onOK={onSave}
          onBegin={onBegin}
          webStyle={webStyle}
          backgroundColor={colors.surface}
          penColor={colors.primaryDark}
          descriptionText=""
          clearText=""
          confirmText=""
          autoClear={false}
          minWidth={1.5}
          maxWidth={3.5}
        />
      </View>
    );
  },
);

SignaturePad.displayName = 'SignaturePad';

/**
 * Injected into the react-native-signature-canvas WebView.
 * - Stretches the canvas to 100% of the container.
 * - Hides the built-in Clear / Save footer so the parent's native buttons
 *   are the sole controls.
 */
const webStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
  .m-signature-pad {
    box-shadow: none;
    border: none;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: transparent;
  }
  .m-signature-pad--body {
    border: none;
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
  }
  .m-signature-pad--body canvas {
    width: 100% !important;
    height: 100% !important;
  }
  .m-signature-pad--footer {
    display: none !important;
  }
`;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});
