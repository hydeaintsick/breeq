# The JavaScript bridge is called by name from the page.
-keepclassmembers class space.breeq.app.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
