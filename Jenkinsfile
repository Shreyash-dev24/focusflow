
pipeline {
    agent none

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DOCKERHUB_REPO = 'shreyash240811/focusflow'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout, Validate and Test') {
            agent {
                label 'linux-builder'
            }
            steps {
                checkout scm

                sh '''
                    set -eu
                    test -f index.html
                    test -f style.css
                    test -f script.js
                    test -f Dockerfile
                    test -f README.md

                    grep -q '<html' index.html
                    grep -q 'function' script.js ||
                        grep -q 'addEventListener' script.js

                    echo "FocusFlow files and basic source checks passed."
                '''
            }
        }

        stage('Build Docker Image') {
            agent {
                label 'linux-builder'
            }
            steps {
                sh '''
                    set -eu
                    docker build \
                      -t ${DOCKERHUB_REPO}:${IMAGE_TAG} \
                      -t ${DOCKERHUB_REPO}:latest .
                '''
            }
        }

        stage('Push to Docker Hub') {
            agent {
                label 'linux-builder'
            }
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
                        echo "$DOCKER_TOKEN" |
                          docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKERHUB_REPO}:${IMAGE_TAG}
                        docker push ${DOCKERHUB_REPO}:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            agent {
                label 'windows-minikube'
            }
            steps {
                bat '''
                    kubectl set image deployment/focusflow focusflow=%DOCKERHUB_REPO%:%IMAGE_TAG%
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Verify Kubernetes Deployment') {
            agent {
                label 'windows-minikube'
            }
            steps {
                bat '''
                    kubectl rollout status deployment/focusflow --timeout=180s
                    if errorlevel 1 exit /b 1
                    kubectl get deployment focusflow
                    kubectl get pods -l app=focusflow
                    kubectl get service focusflow
                '''
            }
        }
    }

    post {
        success {
            echo 'FocusFlow image built, published, and deployed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
    }
}
