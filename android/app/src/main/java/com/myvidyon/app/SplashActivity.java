package com.myvidyon.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.VideoView;
import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {

    private VideoView videoView;
    private Button btnSkip;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make activity full screen
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);

        setContentView(R.layout.activity_splash);

        videoView = findViewById(R.id.videoView);
        btnSkip = findViewById(R.id.btnSkip);

        // Video path from res/raw/splash_video.mp4
        Uri videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.splash_video);
        
        videoView.setVideoURI(videoUri);

        videoView.setOnCompletionListener(mp -> startMainActivity());

        videoView.setOnErrorListener((mp, what, extra) -> {
            startMainActivity();
            return true;
        });

        btnSkip.setOnClickListener(v -> startMainActivity());

        videoView.start();
    }

    private void startMainActivity() {
        if (isFinishing()) return;
        
        Intent intent = new Intent(SplashActivity.this, MainActivity.class);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (videoView != null && videoView.isPlaying()) {
            videoView.pause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (videoView != null) {
            videoView.start();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (videoView != null) {
            videoView.stopPlayback();
        }
    }

    @Override
    public void onBackPressed() {
        // Disable back button during splash
        // super.onBackPressed();
    }
}
