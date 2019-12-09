pipeline {

  environment {
     application = "container-locator-app-0.0.1"
     docker_id = "srivatsabc"
     docker_repo = "container-locator-app"
     docker_tag = "001"
     docker_pwd = "wipro123"
     deploymemt_yaml = "container-locator-app-0.0.1-deployment.yaml"
     service_yaml = "container-locator-app-0.0.1-service.yaml"
     k8s_namespace = "system-api-ns"
     k8s_app = "container-locator-app"
   }

  agent {
      label "master"
  }

  stages {
     stage('Checkout') {
          steps {
            checkout([$class: 'GitSCM',
              branches: [[name: 'container-locator-app']],
              doGenerateSubmoduleConfigurations: false,
              extensions: [[$class: 'SparseCheckoutPaths',  sparseCheckoutPaths:[[$class:'SparseCheckoutPath', path:'container-locator-app-0.0.1/']]]                        ],
              submoduleCfg: [],
              userRemoteConfigs: [[credentialsId: 'srivatsabc_git_login', url: 'https://github.com/srivatsabc/system-api-repo.git']]])

            sh "ls -lat"
          }
      }

    stage('Build in maven') {
      steps {
        sh "echo building $application/pom.xml"
        sh 'mvn -B -f $application/pom.xml clean install'
      }
    }

    stage('script') {
      steps {
        script {
          sh "echo deleting docker image from local $docker_id/$docker_repo:$docker_tag"
          status = sh(returnStatus: true, script: "docker rmi $docker_id/$docker_repo:$docker_tag")
          if (status != 0){
            stage('script') {
                script{
                  status = sh(returnStatus: true, script: "kubectl delete deployment $k8s_app --namespace=$k8s_namespace")
                  if (status != 0){
                    stage('Nothing to delete'){
                      sh "echo no deployment to delete in kubernetes"
                    }
                  }else{
                    stage('script') {
                        script {
                          statusDelete = sh(returnStatus: true, script: "kubectl delete service $k8s_app --namespace=$k8s_namespace")
                          if (statusDelete == 0){
                            sh "echo Trying to delete docker image from local $docker_id/$docker_repo:$docker_tag"
                            sleep 30
                            stage('script'){
                              script{
                                statusDeleteDocker = sh(returnStatus: true, script: "docker rmi $docker_id/$docker_repo:$docker_tag")
                                if(statusDeleteDocker == 0){
                                  stage('Deleted successfully'){
                                    sh "Deleted successfully"
                                  }
                                }else{
                                  stage('Failed to deleted docker image'){
                                    sh "Failed to deleted docker image"
                                  }
                                }
                              }
                            }
                          }else{
                            stage('Nothing to delete'){
                              sh "echo no service to delte in kubernetes"
                            }
                          }
                        }
                    }
                  }
                }
            }
          }
        }
      }
    }

    stage('Build docker image') {
      steps {
        sh "echo build docker image $docker_id/$docker_repo:$docker_tag"
        sh 'docker build -t $docker_id/$docker_repo:$docker_tag $application/.'
      }
    }

    stage('Docker login') {
      steps {
        sh "echo loging into Docker hub"
        sh 'docker login -u $docker_id -p $docker_pwd'
      }
    }

    stage('Docker push') {
      steps {
        sh "echo Pushing $docker_id/$docker_repo:$docker_tag to Docker hub"
        sh 'docker push $docker_id/$docker_repo:$docker_tag'
      }
    }

    /*
    stage('Delete existing Kubernetes deployment') {
      steps {
        sh 'kubectl delete deployment $k8s_app --namespace=$k8s_namespace'
      }
    }

    stage('Delete existing Kubernetes service') {
      steps {
        sh 'kubectl delete service $k8s_app --namespace=$k8s_namespace'
      }
    }*/

    stage('Kubernetes deployment') {
      steps {
        sh 'kubectl apply -n $k8s_namespace -f $application/$deploymemt_yaml'
      }
    }

    stage('Kubernetes service') {
      steps {
        sh 'kubectl apply -n $k8s_namespace -f $application/$service_yaml'
      }
    }
  }
}
