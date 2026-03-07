// Barrel para TypeScript. Na web o Metro usa TabIcon.web.tsx; no mobile usa TabIcon.native.tsx.
// O fallback é .web para nunca carregar react-native-reanimated no bundle web.
export { TabIcon } from './TabIcon.web';
