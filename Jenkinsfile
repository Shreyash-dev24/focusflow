
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
                    grep -q 'function' script.js ||
                    grep -q 'addEventListener' script.js
                    echo "Basic source validation passed."
                '''
            }
        }

        stage('Build Docker Image') {
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

        stage('Deploy to Kubernetes') {
            agent {
                label 'windows-minikube'
            }
            steps {
                echo 'Deploying FocusFlow to Minikube on Windows.'
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
