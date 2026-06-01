pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }
    environment {
        DEPLOY_PATH = '/Users/taniaperez/backend'
    }
    stages {
        stage('Clonar repositorio') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-credentials',
                    url: 'https://github.com/AdrianaRochaVedia/Back_Sacramentos'
            }
        }
        stage('Instalar dependencias') {
            steps {
                sh 'npm install'
            }
        }
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'backend-env', variable: 'ENV_FILE')]) {
                    sh """
                        mkdir -p ${DEPLOY_PATH}
                        rsync -av --exclude='.git' --exclude='node_modules' . ${DEPLOY_PATH}/
                        chmod 644 ${DEPLOY_PATH}/.env 2>/dev/null || true
                        cp \$ENV_FILE ${DEPLOY_PATH}/.env
                        cd ${DEPLOY_PATH}
                        npm install --production
                        pm2 restart backend || pm2 start index.js --name backend
                        pm2 save
                    """
                }
            }
        }
    }
    post {
        success { echo 'Backend desplegado exitosamente!' }
        failure { echo 'Falló el pipeline. Revisa los logs.' }
    }
}
