# The JavaScript bridge is called by name from the page.
-keepclassmembers class com.breeq.breeq.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
