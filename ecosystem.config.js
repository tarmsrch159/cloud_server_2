module.exports = {
  apps : [{
    script: 'index.js',
    watch: '.'
  }, {
    script: './service-worker/',
    watch: ['./service-worker']
  }],

  deploy : {
    production : {
      user : 'node',
      host : '13.228.225.19',
      ref  : 'origin/master',
      repo : 'git@github.com:tarmsrch159/cloud_server_2.git',
      path : '/var/www/cloud_server_2.git',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

// && pm2 reload ecosystem.config.js --env production