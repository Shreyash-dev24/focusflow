
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'FocusFlow source code checked out successfully.'
            }
        }

        stage('Validate Project Files') {
            steps {
                sh '''
                    set -eu
                    test -f index.html
                    test -f style.css
                    test -f script.js
                    test -f Dockerfile
                    test -f README.md
                    echo "All required FocusFlow files are present."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t focusflow:v1 .'
            }
        }
    }

    post {
        success {
            echo 'FocusFlow pipeline completed successfully.'
        }
        failure {
            echo 'FocusFlow pipeline failed. Check the stage logs.'
        }
    }
}
