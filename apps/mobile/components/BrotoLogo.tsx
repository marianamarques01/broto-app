/**
 * Logo mínima — redesign from zero.
 */
import { Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type Size = 'header' | 'hero';

const SIZES: Record<Size, { fontSize: number }> = {
    header: { fontSize: 18 },
    hero: { fontSize: 32 },
};

export function BrotoLogo({ size = 'header' }: { size?: Size }) {
    const { fontSize } = SIZES[size];
    return (
        <View>
            <Text
                style={{
                    fontSize,
                    fontFamily: fonts.logo,
                    color: colors.text.primary,
                }}
            >
                broto
            </Text>
        </View>
    );
}
