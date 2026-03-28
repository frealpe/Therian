import './lib/polyfills'; // Handle Three.js issues early
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import HomeScreen from './views/HomeScreen';

const App = () => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <HomeScreen />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
});

export default App;
