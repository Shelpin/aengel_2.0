#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run madge to detect circular dependencies
const detectCircularDependencies = () => {
    try {
        const output = execSync('npx madge --circular --extensions ts packages/ --warning', { encoding: 'utf8' });
        return output;
    } catch (error) {
        console.error('Error detecting circular dependencies:', error.message);
        return '';
    }
};

// Generate a dependency graph JSON
const generateDependencyGraph = () => {
    try {
        const output = execSync('npx madge --json --extensions ts packages/', { encoding: 'utf8' });
        return JSON.parse(output);
    } catch (error) {
        console.error('Error generating dependency graph:', error.message);
        return {};
    }
};

// Main function
const main = () => {
    // Detect circular dependencies
    const circularDeps = detectCircularDependencies();
    fs.writeFileSync('cycles.log', circularDeps);
    console.log('Circular dependencies written to cycles.log');

    // Generate dependency graph
    const depGraph = generateDependencyGraph();
    fs.writeFileSync('build-graph.json', JSON.stringify(depGraph, null, 2));
    console.log('Dependency graph written to build-graph.json');

    // Try to generate an SVG visualization (requires graphviz)
    try {
        execSync('npx madge --image build-graph.svg --extensions ts packages/', { encoding: 'utf8' });
        console.log('Dependency graph visualization written to build-graph.svg');
    } catch (error) {
        console.error('Error generating dependency graph visualization:', error.message);
    }
};

main(); 