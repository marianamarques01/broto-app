/**
 * Ícone do broto (ilustração) para headers das tabs.
 * Usado em todas as páginas exceto a Home (que mantém BrotoLogo).
 */
import { Image, View } from 'react-native';

const BROTO_ICON = require('../assets/broto-icon.png');

type Size = 'header';

const SIZES: Record<Size, number> = {
    header: 28,
};

export function BrotoIcon({ size = 'header' }: { size?: Size }) {
    const s = SIZES[size];
    return (
        <View style={{ width: s, height: s }}>
            <Image
                source={BROTO_ICON}
                style={{ width: s, height: s }}
                resizeMode="contain"
            />
        </View>
    );
}
