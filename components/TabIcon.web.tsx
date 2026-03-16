import { View } from 'react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { colors } from '@/theme/tokens';

const containerBase = {
    minHeight: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
};
const indicatorBase = {
    position: 'absolute' as const,
    top: -6,
    height: 2,
    width: 32,
    borderRadius: 1,
    backgroundColor: '#DFCC00',
    shadowColor: '#DFCC00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
};
const iconBoxBase = {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
};

export function TabIcon({
    focused,
    Icon,
}: {
    focused: boolean;
    Icon: PhosphorIcon;
}) {
    return (
        <View style={containerBase}>
            <View
                style={[
                    indicatorBase,
                    { opacity: focused ? 1 : 0, transform: [{ scaleX: focused ? 1 : 0.3 }] },
                ]}
            />
            <View
                style={[
                    iconBoxBase,
                    {
                        backgroundColor: focused ? 'rgba(223, 204, 0, 0.2)' : 'transparent',
                        transform: [{ scale: focused ? 1.1 : 1 }],
                    },
                ]}
            >
                <Icon
                    size={24}
                    color={focused ? '#DFCC00' : colors.text.muted}
                    weight={focused ? 'fill' : 'regular'}
                />
            </View>
        </View>
    );
}
