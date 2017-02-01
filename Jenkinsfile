def projectName = 'microdocs-core';
def newVersion = '';
def semver = input message: 'Increase the patch, minor, major version', parameters: [choice(choices: "patch\nminor\nmajor", description: 'Increase the patch, minor, major version', name: 'SEM_VERSION')]
node {
    stage('Checkout'){
        deleteDir()
        echo "Checkout git"
//        git url: 'git@github.com:MaxxtonGroup/microdocs-core.git', credentialsId: '144b99ed-c2b7-4be3-89ca-9803f98bb0e8'
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, submoduleCfg: [], userRemoteConfigs: [[url: 'https://github.com/MaxxtonGroup/microdocs-core', branch: 'master']]])
        stash name: 'src'
    }
    stage('Build'){
        echo "Installing npm dependencies"
        unstash 'src'
        newVersion = sh(returnStdout: true, script: 'npm version ' + semver).trim()
        sh 'npm install'
        stash name: 'build'
    }

    stage('Test'){
        echo "Test"
        unstash 'build'
        sh 'npm test'
    }

    stage('PrePublish'){
        dir('microdocs-core-ts'){
            echo "PrePublish"
            unstash 'build'
            sh 'npm run prepublish'
            dir('dist'){
                stash 'dist'
            }
        }
    }

//    stage('Git Tag'){
//        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: '2cecab87-b4d7-47cd-9407-1239f9ee9a1c', usernameVariable: 'GIT_USERNAME', passwordVariable: 'GIT_PASSWORD']]) {
//            sh('git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/MaxxtonGroup/microdocs-core --tags')
//        }
//    }

    stage('Publish'){
        dir('microdocs-core-ts/dist'){
            echo "Publish"
            unstash 'dist'
            sh 'echo @maxxton:registry=https://npm.maxxton.com > .npmrc'
            sh 'npm publish'
        }
    }
}