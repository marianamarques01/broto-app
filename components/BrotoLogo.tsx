/**
 * Logo provisória "broto" — mesma estilização da tela de login (gradiente verde → dourado).
 * Uso: headers das tabs e qualquer tela que precise da marca.
 */
import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts, fontSize } from '@/theme/tokens';

const GRADIENT_COLORS = [colors.green[300], colors.green[500], colors.gold[300]] as const;

type Size = 'header' | 'hero';

const SIZES: Record<Size, { width: number; height: number }> = {
    header: { width: 72, height: 22 },
    hero: { width: 180, height: 56 },
};

export function BrotoLogo({ size = 'header' }: { size?: Size }) {
    const { width, height } = SIZES[size];

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height} viewBox="0 0 180 56">
                <Defs>
                    <SvgLinearGradient id={`brotoLogoGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={GRADIENT_COLORS[0]} />
                        <Stop offset="40%" stopColor={GRADIENT_COLORS[1]} />
                        <Stop offset="100%" stopColor={GRADIENT_COLORS[2]} />
                    </SvgLinearGradient>
                </Defs>
                <SvgText
                    x="90"
                    y={fontSize['5xl']}
                    textAnchor="middle"
                    fill={`url(#brotoLogoGrad-${size})`}
                    fontSize={fontSize['5xl']}
                    fontWeight="600"
                    fontFamily={fonts.logo}
                    letterSpacing={-0.5}
                >
                    broto
                </SvgText>
            </Svg>
        </View>
    );
}
