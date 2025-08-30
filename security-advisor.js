#!/usr/bin/env node

/**
 * Security Advisor Agent - Fisher Backflows Platform
 * Comprehensive security analysis and recommendations
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SecurityAdvisor {
  constructor() {
    this.projectRoot = '/mnt/c/users/Fishe/fisherbackflows2/fisherbackflows-platform';
    this.vulnerabilities = [];
    this.recommendations = [];
    this.securityScore = 0;
  }

  async analyzeProject() {
    console.log('🔒 Fisher Backflows Platform Security Analysis');
    console.log('='.repeat(50));
    
    await this.analyzeAuthentication();
    await this.analyzeDatabase();
    await this.analyzeAPIEndpoints();
    await this.analyzeEnvironmentVariables();
    await this.analyzeFilePermissions();
    await this.analyzeDependencies();
    await this.analyzeInputValidation();
    await this.analyzeErrorHandling();
    await this.analyzeLogging();
    await this.analyzeHTTPS();
    
    this.calculateSecurityScore();
    this.generateReport();
  }

  async analyzeAuthentication() {
    console.log('\n🔐 Authentication Security Analysis...');
    
    try {
      // Check auth implementation
      const authFile = path.join(this.projectRoot, 'src/lib/auth.ts');
      const authContent = await fs.readFile(authFile, 'utf8');
      
      // Check for secure password handling
      if (authContent.includes('bcrypt')) {
        this.addRecommendation('✅ Good: Using bcrypt for password hashing');
      } else {
        this.addVulnerability('❌ Critical: No password hashing detected', 'HIGH');
      }

      // Check for JWT implementation
      if (authContent.includes('jwt') || authContent.includes('token')) {
        this.addRecommendation('✅ Good: Token-based authentication implemented');
      }

      // Check for session management
      if (authContent.includes('session') || authContent.includes('cookie')) {
        this.addRecommendation('✅ Good: Session management implemented');
        
        // Check for secure cookie settings
        if (authContent.includes('httpOnly') && authContent.includes('secure')) {
          this.addRecommendation('✅ Excellent: Secure cookie settings found');
        } else {
          this.addVulnerability('⚠️  Warning: Cookie security flags missing', 'MEDIUM');
        }
      }

      // Check for rate limiting
      const middlewareFiles = await this.findFiles('src', /middleware|rate.*limit/i);
      if (middlewareFiles.length > 0) {
        this.addRecommendation('✅ Good: Rate limiting middleware detected');
      } else {
        this.addVulnerability('⚠️  Warning: No rate limiting detected', 'MEDIUM');
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze authentication system', 'HIGH');
    }
  }

  async analyzeDatabase() {
    console.log('\n🗄️ Database Security Analysis...');
    
    try {
      // Check for SQL injection protection
      const apiFiles = await this.findFiles('src/app/api', /route\.(ts|js)$/);
      let hasParameterizedQueries = 0;
      let totalQueries = 0;

      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for Supabase usage (safer than raw SQL)
        if (content.includes('supabase.from(')) {
          hasParameterizedQueries++;
        }
        
        // Check for dangerous patterns
        if (content.includes('${') && content.includes('query')) {
          this.addVulnerability('❌ Critical: Potential SQL injection via string interpolation', 'HIGH');
        }
        
        totalQueries++;
      }

      if (hasParameterizedQueries > 0) {
        this.addRecommendation('✅ Good: Using Supabase ORM (protects against SQL injection)');
      }

      // Check for RLS (Row Level Security)
      const testFiles = await this.findFiles('.', /security.*fix|rls/i);
      if (testFiles.length > 0) {
        this.addRecommendation('✅ Excellent: Row Level Security (RLS) implementation detected');
      } else {
        this.addVulnerability('⚠️  Warning: No Row Level Security detected', 'MEDIUM');
      }

      // Check environment variables for database
      const envFile = path.join(this.projectRoot, '.env.local');
      try {
        const envContent = await fs.readFile(envFile, 'utf8');
        if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          this.addRecommendation('✅ Good: Database service keys properly configured');
        }
      } catch (e) {
        this.addVulnerability('⚠️  Warning: Environment file not accessible', 'LOW');
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze database security', 'MEDIUM');
    }
  }

  async analyzeAPIEndpoints() {
    console.log('\n🌐 API Endpoint Security Analysis...');
    
    try {
      const apiFiles = await this.findFiles('src/app/api', /route\.(ts|js)$/);
      let protectedEndpoints = 0;
      let totalEndpoints = 0;

      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for authentication
        if (content.includes('auth.getApiUser') || content.includes('getUser')) {
          protectedEndpoints++;
          this.addRecommendation(`✅ Protected: ${relativePath}`);
        } else {
          this.addVulnerability(`⚠️  Unprotected endpoint: ${relativePath}`, 'MEDIUM');
        }

        // Check for input validation
        if (content.includes('zod') || content.includes('validation') || content.includes('schema')) {
          this.addRecommendation(`✅ Input validation: ${relativePath}`);
        } else {
          this.addVulnerability(`⚠️  No input validation: ${relativePath}`, 'MEDIUM');
        }

        // Check for CORS
        if (content.includes('cors') || content.includes('origin')) {
          this.addRecommendation(`✅ CORS configured: ${relativePath}`);
        }

        totalEndpoints++;
      }

      console.log(`   📊 ${protectedEndpoints}/${totalEndpoints} endpoints have authentication`);

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze API endpoints', 'MEDIUM');
    }
  }

  async analyzeEnvironmentVariables() {
    console.log('\n🔧 Environment Variable Security...');
    
    try {
      // Check for exposed secrets in code
      const sourceFiles = await this.findFiles('src', /\.(ts|js|tsx|jsx)$/);
      
      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for hardcoded secrets
        const secretPatterns = [
          /password\s*=\s*['"][^'"]+['"]/i,
          /secret\s*=\s*['"][^'"]+['"]/i,
          /key\s*=\s*['"][^'"]+['"]/i,
          /token\s*=\s*['"][^'"]+['"]/i
        ];

        secretPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            this.addVulnerability(`❌ Critical: Hardcoded secret in ${relativePath}`, 'HIGH');
          }
        });

        // Check for proper env usage
        if (content.includes('process.env.')) {
          this.addRecommendation(`✅ Using environment variables: ${relativePath}`);
        }
      }

      // Check for .env in version control
      try {
        const { stdout } = await execAsync('git ls-files | grep -E "\\.env"', { cwd: this.projectRoot });
        if (stdout.trim()) {
          this.addVulnerability('❌ Critical: .env files tracked in git', 'HIGH');
        } else {
          this.addRecommendation('✅ Good: .env files not in version control');
        }
      } catch (e) {
        // No .env files found in git, which is good
        this.addRecommendation('✅ Good: No .env files in version control');
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze environment variables', 'MEDIUM');
    }
  }

  async analyzeFilePermissions() {
    console.log('\n📁 File Permission Security...');
    
    try {
      // Check critical file permissions
      const criticalFiles = [
        '.env.local',
        'mcp-server.js',
        'mcp-control.sh',
        'package.json'
      ];

      for (const file of criticalFiles) {
        const filePath = path.join(this.projectRoot, file);
        try {
          const stats = await fs.stat(filePath);
          const mode = (stats.mode & parseInt('777', 8)).toString(8);
          
          if (file.includes('.env') && mode !== '600') {
            this.addVulnerability(`⚠️  Warning: ${file} permissions (${mode}) should be 600`, 'MEDIUM');
          } else if (file.includes('.sh') && mode !== '755') {
            this.addVulnerability(`⚠️  Warning: ${file} permissions (${mode}) should be 755`, 'LOW');
          } else {
            this.addRecommendation(`✅ Good: ${file} has appropriate permissions (${mode})`);
          }
        } catch (e) {
          // File might not exist, which is okay for some files
        }
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze file permissions', 'LOW');
    }
  }

  async analyzeDependencies() {
    console.log('\n📦 Dependency Security Analysis...');
    
    try {
      // Check for known vulnerabilities
      try {
        const { stdout, stderr } = await execAsync('npm audit --json', { cwd: this.projectRoot });
        const auditResult = JSON.parse(stdout);
        
        if (auditResult.vulnerabilities) {
          const vulnCount = Object.keys(auditResult.vulnerabilities).length;
          if (vulnCount > 0) {
            this.addVulnerability(`⚠️  Warning: ${vulnCount} dependency vulnerabilities found`, 'MEDIUM');
            this.addRecommendation('Run `npm audit fix` to resolve dependency issues');
          } else {
            this.addRecommendation('✅ Good: No known dependency vulnerabilities');
          }
        }
      } catch (auditError) {
        // npm audit might fail, try alternative check
        this.addRecommendation('💡 Run `npm audit` manually to check for vulnerabilities');
      }

      // Check for outdated dependencies
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8'));
      
      // Check for security-related packages
      const securityPackages = ['helmet', 'cors', 'express-rate-limit', 'bcrypt'];
      const installedSecurityPackages = securityPackages.filter(pkg => 
        packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
      );
      
      if (installedSecurityPackages.length > 0) {
        this.addRecommendation(`✅ Good: Security packages installed: ${installedSecurityPackages.join(', ')}`);
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze dependencies', 'MEDIUM');
    }
  }

  async analyzeInputValidation() {
    console.log('\n🔍 Input Validation Analysis...');
    
    try {
      const apiFiles = await this.findFiles('src/app/api', /route\.(ts|js)$/);
      let validatedEndpoints = 0;
      
      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for validation libraries
        if (content.includes('zod') || content.includes('joi') || content.includes('yup')) {
          validatedEndpoints++;
        }
        
        // Check for dangerous practices
        if (content.includes('eval(') || content.includes('Function(')) {
          this.addVulnerability(`❌ Critical: Code execution vulnerability in ${relativePath}`, 'HIGH');
        }
        
        // Check for XSS protection
        if (content.includes('sanitize') || content.includes('escape')) {
          this.addRecommendation(`✅ Good: XSS protection in ${relativePath}`);
        }
      }

      if (validatedEndpoints > 0) {
        this.addRecommendation(`✅ Good: ${validatedEndpoints} endpoints have input validation`);
      } else {
        this.addVulnerability('⚠️  Warning: No input validation framework detected', 'MEDIUM');
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze input validation', 'MEDIUM');
    }
  }

  async analyzeErrorHandling() {
    console.log('\n⚠️ Error Handling Security...');
    
    try {
      const apiFiles = await this.findFiles('src/app/api', /route\.(ts|js)$/);
      let secureErrorHandling = 0;
      
      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for proper error handling
        if (content.includes('try') && content.includes('catch')) {
          secureErrorHandling++;
          
          // Check for information disclosure
          if (content.includes('console.error') && !content.includes('production')) {
            this.addVulnerability(`⚠️  Information disclosure risk in ${relativePath}`, 'LOW');
          }
        }
      }

      if (secureErrorHandling > 0) {
        this.addRecommendation(`✅ Good: ${secureErrorHandling} endpoints have error handling`);
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze error handling', 'LOW');
    }
  }

  async analyzeLogging() {
    console.log('\n📝 Logging Security Analysis...');
    
    try {
      const sourceFiles = await this.findFiles('src', /\.(ts|js|tsx|jsx)$/);
      let hasSecureLogging = false;
      
      for (const file of sourceFiles.slice(0, 10)) { // Sample first 10 files
        const content = await fs.readFile(file, 'utf8');
        
        // Check for logging frameworks
        if (content.includes('winston') || content.includes('pino') || content.includes('bunyan')) {
          hasSecureLogging = true;
          this.addRecommendation('✅ Good: Professional logging framework detected');
          break;
        }
        
        // Check for sensitive data in logs
        if (content.includes('console.log') && (content.includes('password') || content.includes('token'))) {
          this.addVulnerability('⚠️  Warning: Potential sensitive data in logs', 'MEDIUM');
        }
      }

      if (!hasSecureLogging) {
        this.addRecommendation('💡 Consider implementing structured logging (winston, pino)');
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze logging', 'LOW');
    }
  }

  async analyzeHTTPS() {
    console.log('\n🔒 HTTPS and Transport Security...');
    
    try {
      // Check Next.js configuration
      const nextConfig = path.join(this.projectRoot, 'next.config.js');
      try {
        const content = await fs.readFile(nextConfig, 'utf8');
        
        if (content.includes('https') || content.includes('ssl')) {
          this.addRecommendation('✅ Good: HTTPS configuration detected');
        } else {
          this.addRecommendation('💡 Consider configuring HTTPS for production');
        }
        
        // Check for security headers
        if (content.includes('helmet') || content.includes('headers')) {
          this.addRecommendation('✅ Good: Security headers configured');
        } else {
          this.addVulnerability('⚠️  Warning: No security headers configuration', 'MEDIUM');
        }
      } catch (e) {
        this.addRecommendation('💡 Consider adding next.config.js for security headers');
      }

    } catch (error) {
      this.addVulnerability('❌ Error: Could not analyze HTTPS configuration', 'LOW');
    }
  }

  async findFiles(dir, pattern) {
    const files = [];
    const fullDir = path.join(this.projectRoot, dir);
    
    try {
      const items = await fs.readdir(fullDir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(fullDir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          const subFiles = await this.findFiles(path.join(dir, item.name), pattern);
          files.push(...subFiles);
        } else if (item.isFile() && pattern.test(item.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be inaccessible
    }
    
    return files;
  }

  addVulnerability(message, severity) {
    this.vulnerabilities.push({ message, severity, timestamp: new Date() });
    console.log(`   ${message}`);
  }

  addRecommendation(message) {
    this.recommendations.push({ message, timestamp: new Date() });
    console.log(`   ${message}`);
  }

  calculateSecurityScore() {
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const warningCount = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const lowCount = this.vulnerabilities.filter(v => v.severity === 'LOW').length;
    
    let score = 100;
    score -= (criticalCount * 20);
    score -= (warningCount * 10);
    score -= (lowCount * 5);
    
    this.securityScore = Math.max(0, score);
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('🔒 SECURITY ANALYSIS REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📊 Security Score: ${this.securityScore}/100`);
    
    if (this.securityScore >= 90) {
      console.log('🟢 Status: EXCELLENT - Strong security posture');
    } else if (this.securityScore >= 70) {
      console.log('🟡 Status: GOOD - Some improvements needed');
    } else if (this.securityScore >= 50) {
      console.log('🟠 Status: MODERATE - Several security concerns');
    } else {
      console.log('🔴 Status: CRITICAL - Immediate attention required');
    }

    console.log(`\n📈 Summary:`);
    console.log(`   • Critical Issues: ${this.vulnerabilities.filter(v => v.severity === 'HIGH').length}`);
    console.log(`   • Warnings: ${this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length}`);
    console.log(`   • Low Risk: ${this.vulnerabilities.filter(v => v.severity === 'LOW').length}`);
    console.log(`   • Positive Findings: ${this.recommendations.length}`);

    if (this.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILITIES TO ADDRESS:');
      this.vulnerabilities
        .sort((a, b) => {
          const severityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .forEach(vuln => {
          console.log(`   ${vuln.message}`);
        });
    }

    console.log('\n💡 SECURITY RECOMMENDATIONS:');
    console.log('1. Implement comprehensive input validation on all endpoints');
    console.log('2. Add rate limiting to prevent abuse');
    console.log('3. Configure security headers (HSTS, CSP, X-Frame-Options)');
    console.log('4. Set up automated security scanning in CI/CD');
    console.log('5. Implement structured logging with security event monitoring');
    console.log('6. Regular dependency audits and updates');
    console.log('7. Code review process focusing on security');
    console.log('8. Security testing (SAST/DAST) integration');

    console.log('\n🔧 IMMEDIATE ACTIONS:');
    const criticalIssues = this.vulnerabilities.filter(v => v.severity === 'HIGH');
    if (criticalIssues.length > 0) {
      console.log('   🔴 Address all critical security issues immediately');
      criticalIssues.forEach(issue => {
        console.log(`      - ${issue.message}`);
      });
    } else {
      console.log('   ✅ No critical security issues found');
    }

    console.log(`\n📅 Report Generated: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
  }

  async generateSecurityChecklistFile() {
    const checklist = `# Fisher Backflows Platform Security Checklist

Generated: ${new Date().toLocaleString()}
Security Score: ${this.securityScore}/100

## Critical Security Controls ✅

### Authentication & Authorization
- [ ] Multi-factor authentication implemented
- [ ] Strong password policies enforced  
- [ ] Session timeout configured
- [ ] Role-based access control (RBAC)
- [ ] API authentication on all endpoints

### Data Protection
- [ ] All sensitive data encrypted at rest
- [ ] Data encrypted in transit (HTTPS)
- [ ] Database connection encryption
- [ ] Regular backup encryption
- [ ] Data retention policies

### Input Validation & Sanitization
- [ ] All user inputs validated
- [ ] SQL injection protection
- [ ] XSS prevention measures
- [ ] File upload security
- [ ] API parameter validation

### Infrastructure Security
- [ ] Firewall configuration
- [ ] Network segmentation
- [ ] Regular security updates
- [ ] Monitoring and logging
- [ ] Incident response plan

### Application Security
- [ ] Secure coding practices
- [ ] Regular security testing
- [ ] Dependency vulnerability scanning
- [ ] Error handling that doesn't expose info
- [ ] Security headers configured

## Current Findings

### Vulnerabilities Found: ${this.vulnerabilities.length}
${this.vulnerabilities.map(v => `- ${v.severity}: ${v.message}`).join('\n')}

### Positive Security Measures: ${this.recommendations.length}
${this.recommendations.map(r => `- ${r.message}`).join('\n')}

## Next Steps

1. Address all HIGH severity vulnerabilities immediately
2. Implement missing security controls
3. Set up automated security scanning
4. Create security incident response procedures
5. Regular security reviews and updates

---
*This checklist should be reviewed and updated monthly*
`;

    await fs.writeFile(path.join(this.projectRoot, 'SECURITY-CHECKLIST.md'), checklist);
    console.log('\n📄 Security checklist saved to SECURITY-CHECKLIST.md');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  const advisor = new SecurityAdvisor();

  switch (command) {
    case 'analyze':
    case 'scan':
      await advisor.analyzeProject();
      await advisor.generateSecurityChecklistFile();
      break;
      
    case 'checklist':
      await advisor.generateSecurityChecklistFile();
      console.log('✅ Security checklist generated');
      break;
      
    case 'help':
      console.log('Fisher Backflows Security Advisor');
      console.log('Usage: node security-advisor.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  analyze   - Full security analysis (default)');
      console.log('  scan      - Alias for analyze');
      console.log('  checklist - Generate security checklist only');
      console.log('  help      - Show this help message');
      break;
      
    default:
      console.log('Unknown command. Use "help" for available commands.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Security Advisor Error:', error);
    process.exit(1);
  });
}

module.exports = SecurityAdvisor;