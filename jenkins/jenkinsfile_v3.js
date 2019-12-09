pipeline {

  environment {
     application = "route-locator-0.0.2"
     docker_id = "srivatsabc"
     docker_repo = "route-locator-app"
     docker_tag = "002"
     docker_pwd = "wipro123"
     deploymemt_yaml = "route-locator-0.0.2-deployment.yaml"
     service_yaml = "route-locator-0.0.2-service.yaml"
     k8s_namespace = "system-api-ns"
     k8s_app = "route-locator-app"
   }

  agent {
      label "master"
  }

  stages {
    stage('Checkout') {
        steps {
          checkout([$class: 'GitSCM',
              branches: [[name: '*/master']],
              doGenerateSubmoduleConfigurations: false,
              extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: '$application']],
              submoduleCfg: [],
              userRemoteConfigs: [[url: 'https://github.com/srivatsabc/system-api-repo.git', credentialsId:'srivatsabc_git_login']]])

          sh "ls -lat"
          }
        }

    stage('Project using maven') {
      steps {
        sh "echo building $application/pom.xml"
        sh 'mvn -B -f $application/pom.xml clean install'
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

    stage('Delete existing Kubernetes deployment') {
      steps {
        sh 'kubectl delete deployment $k8s_app --namespace=$k8s_namespace'
      }
    }

    stage('Delete existing Kubernetes service') {
      steps {
        sh 'kubectl delete service $k8s_app --namespace=$k8s_namespace'
      }
    }

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
