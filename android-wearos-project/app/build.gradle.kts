plugins {
    id("com.android.application")
}

android {
    namespace = "com.galaxywatch.sportface"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.galaxywatch.sportface"
        minSdk = 33 // Android 13 / Wear OS 4+ (Strictly required for Watch Face Format)
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
