module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === '@swc/core' || pkg.name === 'esbuild') {
        if (pkg.scripts) {
          pkg.scripts['preinstall'] = 'node -e "console.log(\'Skipping preinstall for \' + process.env.PNPM_PACKAGE_NAME)"';
          pkg.scripts['install'] = 'node -e "console.log(\'Skipping install for \' + process.env.PNPM_PACKAGE_NAME)"';
          pkg.scripts['postinstall'] = 'node -e "console.log(\'Skipping postinstall for \' + process.env.PNPM_PACKAGE_NAME)"';
        }
        // Allow all lifecycle scripts to run for these packages
        pkg.scripts = {
          ...pkg.scripts,
          'build': 'node -e "console.log(\'Running build for \' + process.env.PNPM_PACKAGE_NAME)"',
          'prepublishOnly': 'node -e "console.log(\'Running prepublishOnly for \' + process.env.PNPM_PACKAGE_NAME)"',
          'prepare': 'node -e "console.log(\'Running prepare for \' + process.env.PNPM_PACKAGE_NAME)"',
        };
      }
      return pkg;
    },
  },
};