import java.util.Properties

plugins {
    id("com.android.application")
}

// ---- Version (android/version.properties, bumped by release.sh) ----
val versionProps = Properties().apply {
    rootProject.file("version.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}
val appVersionCode = (project.findProperty("breeq.versionCode") as String?)?.toInt()
    ?: versionProps.getProperty("versionCode", "1").toInt()
val appVersionName = (project.findProperty("breeq.versionName") as String?)
    ?: versionProps.getProperty("versionName", "1.0.0")

// ---- Signing (android/keystore.properties, created by release.sh, never committed) ----
val keystoreProps = Properties().apply {
    rootProject.file("keystore.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}
val hasReleaseKey = keystoreProps.getProperty("storeFile")?.let { rootProject.file(it).exists() } == true

val startUrl = project.findProperty("breeq.startUrl") as String? ?: "https://breeq.space/game/menu"
val appHosts = project.findProperty("breeq.appHosts") as String? ?: "breeq.space"

android {
    namespace = "com.breeq.breeq"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.breeq.breeq"
        // Android 6.0 (2015) and up: every device that still gets WebView updates.
        minSdk = 23
        targetSdk = 36
        versionCode = appVersionCode
        versionName = appVersionName

        buildConfigField("String", "START_URL", "\"$startUrl\"")
        buildConfigField("String", "APP_HOSTS", "\"$appHosts\"")
    }

    signingConfigs {
        if (hasReleaseKey) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseKey) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    bundle {
        language { enableSplit = false }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.19.0")
    implementation("androidx.core:core-splashscreen:1.2.0")
    implementation("androidx.activity:activity-ktx:1.13.0")
}
