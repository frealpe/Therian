import './lib/polyfills'; // Handle Three.js issues early
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import HomeScreen from './views/HomeScreen';
import { Theme } from './styles/Theme';
import FontLoader from './components/FontLoader';

const App = () => {
    return (
        <FontLoader>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <HomeScreen />
            </View>
        </FontLoader>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.bg,
    },
});

export default App;
