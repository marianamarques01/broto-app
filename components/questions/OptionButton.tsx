import { Pressable, Text, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

export type OptionState = 'idle' | 'correct' | 'wrong';

interface OptionButtonProps {
    letter: string;
    text: string | null;
    state: OptionState;
    answered: boolean;
    onPress: () => void;
}

const containerBg: Record<OptionState, string | undefined> = {
    idle: undefined,
    correct: 'rgba(34,197,94,0.08)',
    wrong: colors.red.glow,
};

const borderColors: Record<OptionState, string> = {
    idle: colors.border.default,
    correct: 'rgba(34,197,94,0.3)',
    wrong: 'rgba(239,68,68,0.3)',
};

const badgeBg: Record<OptionState, string> = {
    idle: colors.bg.surface,
    correct: colors.green[500],
    wrong: colors.red[500],
};

const textColor: Record<OptionState, string> = {
    idle: colors.text.primary,
    correct: colors.green[500],
    wrong: colors.red[500],
};

export function OptionButton({
    letter,
    text,
    state,
    answered,
    onPress,
}: OptionButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={answered}
            className="flex-row items-start gap-3 rounded-xl p-3.5"
            style={{
                borderWidth: 2,
                borderColor: borderColors[state],
                backgroundColor: containerBg[state] ?? colors.bg.card,
            }}
        >
            <View
                className="h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: badgeBg[state] }}
            >
                {state === 'correct' ? (
                    <Check size={14} strokeWidth={3} color="#fff" />
                ) : state === 'wrong' ? (
                    <X size={14} strokeWidth={3} color="#fff" />
                ) : (
                    <Text className="text-xs font-bold text-foreground">
                        {letter}
                    </Text>
                )}
            </View>
            {text && (
                <Text
                    className="flex-1 pt-0.5 text-sm leading-relaxed"
                    style={{ color: textColor[state] }}
                >
                    {text}
                </Text>
            )}
        </Pressable>
    );
}
