const swarmCore = require('../SwarmControlCore');

// Mock external dependencies
jest.mock('../SocketService', () => ({
    emit: jest.fn()
}));

describe('SwarmControlCore logic', () => {
    
    test('PID calculation should return 0 when error is below threshold', () => {
        const state = {
            pos: { x: 0, y: 1.5, z: 0 },
            pid: {
                integral: { x: 0, y: 0, z: 0 },
                lastError: { x: 0, y: 0, z: 0 }
            }
        };
        const target = { x: 0.1, y: 1.5, z: 0.1 }; // Error = 0.14m < 0.4m threshold
        
        const result = swarmCore._calculatePID(state, target);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });

    test('Repulsion calculation should return correct vector based on angle', () => {
        // Angle 0 degrees (front) -> Repulsion should be in -X
        const result = swarmCore._calculateRepulsion(0);
        expect(result.x).toBeLessThan(0);
        expect(result.z).toBeCloseTo(0);

        // Angle 90 degrees (right?) -> Repulsion should be in -Z
        const result90 = swarmCore._calculateRepulsion(90);
        expect(result90.z).toBeLessThan(0);
        expect(result90.x).toBeCloseTo(0);
    });

    test('Distance utility should calculate 3D distance correctly', () => {
        const p1 = { x: 0, y: 0, z: 0 };
        const p2 = { x: 3, y: 4, z: 0 };
        expect(swarmCore._distance(p1, p2)).toBe(5);
    });

    test('Clamp utility should keep value within bounds', () => {
        expect(swarmCore._clamp(5, 1, 10)).toBe(5);
        expect(swarmCore._clamp(0, 1, 10)).toBe(1);
        expect(swarmCore._clamp(15, 1, 10)).toBe(10);
    });
});
