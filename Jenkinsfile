
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DOCKERHUB_REPO = 'shreyash240811/focusflow'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'FocusFlow source code checked out.'
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
                    echo "Required files validated."
                '''
            }
        }

        stage('Build and Test') {
            steps {
                sh '''
                    set -eu
                    grep -q '<html' index.html
                    grep -q 'function' script.js || \
                    grep -q 'addEventListener' script.js
                    echo "Basic source validation passed."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                      -t ${DOCKERHUB_REPO}:${IMAGE_TAG} \
                      -t ${DOCKERHUB_REPO}:latest .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        echo "$DOCKER_TOKEN" | \
                          docker login -u "$DOCKER_USER" \
                          --password-stdin
                        docker push ${DOCKERHUB_REPO}:${IMAGE_TAG}
                        docker push ${DOCKERHUB_REPO}:latest
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'FocusFlow image built and published successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
    }
}
