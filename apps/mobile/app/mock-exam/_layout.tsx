import { Stack } from 'expo-router'

export default function MockExamLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#02140D' },
            }}
        />
    )
}
