module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'], // 允许使用需要类型信息的规则
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // 使用TSLint推荐规则
  ],
  env: {
    node: true, // 启用Node.js全局变量和作用域
  },
  rules: {
    // 您可以在此添加或覆盖规则
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.cjs', // 忽略此配置文件本身
    'esbuild.js',
  ],
};
