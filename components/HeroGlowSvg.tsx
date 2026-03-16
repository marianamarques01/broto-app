/**
 * Placeholder mínimo — redesign from zero.
 * Antes: glow radial e hero; agora vazio para novo design.
 */
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function CentralGlowSvg({ subtle = false }: { subtle?: boolean }) {
    return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
}

export function HeroGlowSvg({ height }: { height?: number } = {}) {
    return (
        <View
            style={[StyleSheet.absoluteFill, { width: SCREEN_W, height: height ?? SCREEN_H }]}
            pointerEvents="none"
        />
    );
}
