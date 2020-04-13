pipeline {

  environment {
     GIT_SUBDIRECTORY = "country_locator_app_001"
     GIT_REPO_URL = "https://github.com/srivatsabc/system_api_repository_3.git"
     OKD_APP = "country-locator-app-v001"
     OKD_NAMESPACE = "system-api-ns"
     CONFIG_MAP = "country-locator-app-v001-config"
     DOCKER_ID = "srivatsabc"
     DOCKER_REPO = "country-locator-app"
     DOCKER_TAG = "os-s-api-v0.0.1"
     DOCKER_PWD = "wipro123"
     DEPLOYMENT_YAML = "country-locator-app-0.0.1-deployment.yaml"
     SERVICE_YAML = "country-locator-app-0.0.1-service.yaml"
   }


   agent {
      label "master"
  }

  stages {
     stage('Checkout') {
          steps {
            checkout([$class: 'GitSCM',
              branches: [[name: 'master']],
              doGenerateSubmoduleConfigurations: false,
              extensions: [[$class: 'SparseCheckoutPaths',  sparseCheckoutPaths:[[$class:'SparseCheckoutPath', path:"${GIT_SUBDIRECTORY}/"]]]],
              submoduleCfg: [],
              userRemoteConfigs: [[credentialsId: 'srivatsabc_git_login', url: "${GIT_REPO_URL}"]]])

            sh "ls -lat"
          }
      }

	stage('Create IBM ACE Bar') {
      steps {
         sh 'xvfb-run "/opt/ibm/ace-11.0.0.6/tools/mqsicreatebar" -data `pwd` -b `pwd`/$GIT_SUBDIRECTORY/target/ace/$GIT_SUBDIRECTORY.bar -cleanBuild -a $GIT_SUBDIRECTORY -deployAsSource -trace -v `pwd`/$GIT_SUBDIRECTORY/target/createbartrace.txt'
      }
    }

  stage('Check IBM ACE Bar') {
      steps {
         sh '/bin/bash -c "source /opt/ibm/ace-11.0.0.6/server/bin/mqsiprofile; mqsireadbar -b `pwd`/$GIT_SUBDIRECTORY/target/ace/$GIT_SUBDIRECTORY.bar"'
      }
    }

	stage('OpenShift deployment delete') {
        steps {
          script {
            sh "echo deleting the current OpenShift deployment $OKD_APP from namespace $OKD_NAMESPACE"
            status = sh(returnStatus: true, script: "oc delete deployment $OKD_APP --namespace=$OKD_NAMESPACE")
            if (status == 0){
              stage('OpenShift service delete') {
                  script{
                    sh "echo deleting the current OpenShift service $OKD_APP from namespace $OKD_NAMESPACE"
                    status = sh(returnStatus: true, script: "oc delete service $OKD_APP --namespace=$OKD_NAMESPACE")
                    if (status == 0){
                      stage('Deleting current docker image from local repo'){
                        sh "echo deleting docker image from local $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG"
                        status = sh(returnStatus: true, script: "docker rmi $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG -f")
                        if (status == 0){
                          sh "echo Delete kube deployment service and docker image successfully"
                        }else{
                          stage('Nothing docker image to delete'){
                            sh "echo no docker image to delete in local repo"
                          }
                        }
                      }
                    }else{
                      stage('No OpenShift service to delete'){
                        sh "echo no service available in OpenShift"
                      }
                    }
                  }
              }
            }else{
              stage('No OpenShift deployment to delete'){
                sh "echo no deployment available in OpenShift"
              }
            }
          }
        }
      }

    stage('Build docker image') {
      steps {
        sh "echo build docker image $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG"
        sh 'docker rmi $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG -f'
        sh 'docker build -t $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG $GIT_SUBDIRECTORY/.'
      }
    }

    stage('Login to docker hub') {
        steps {
          sh "echo Login to docker hub"
          sh 'docker login -u $DOCKER_ID -p $DOCKER_PWD'
        }
      }

    stage('Push docker image to docker hub') {
      steps {
        sh "echo Pushing $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG to Docker Hub"
        sh 'docker push $DOCKER_ID/$DOCKER_REPO:$DOCKER_TAG'
      }
    }

    stage('OpenShift configmap') {
        steps {
          script {
            sh "echo creating oc create -n $OKD_NAMESPACE configmap $CONFIG_MAP --from-literal=RUNTIME_ENV_TYPE=k8s"
            statusCreate = sh(returnStatus: true, script: "oc create -n $OKD_NAMESPACE configmap $CONFIG_MAP --from-literal=RUNTIME_ENV_TYPE=k8s")
            if (statusCreate != 0){
              sh "echo Unable to create $CONFIG_MAP in $OKD_NAMESPACE as it already exists"
            }else{
              stage('OpenShift configmap created'){
                sh "echo OpenShift configmap successfully created"
              }
            }
          }
        }
      }

    stage('OpenShift deployment') {
      steps {
        sh 'oc whoami'
        sh 'oc apply -n $OKD_NAMESPACE -f $GIT_SUBDIRECTORY/$DEPLOYMENT_YAML'
      }
    }

    stage('OpenShift service') {
      steps {
        sh 'oc apply -n $OKD_NAMESPACE -f $GIT_SUBDIRECTORY/$SERVICE_YAML'
      }
    }
  }
}
