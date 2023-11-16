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
      host : ['https://server-2-s3v5.onrender.com'],
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