# Sound Files Setup

This directory should contain the following sound files for the tournament application:

## Required Sound Files:

1. **roulette-spin.mp3** - Continuous spinning/wheel sound during roulette animation (should loop well)
2. **click.mp3** - Short click sound when players lock in during roulette
3. **success.mp3** - Success bell/chime when roulette finishes
4. **victory.mp3** - Victory fanfare for match wins
5. **tournament-won.mp3** - Grand victory sound for tournament wins

## Recommended Sound Sources:

### Free Sound Libraries:
- **Freesound.org** - Royalty-free sounds with Creative Commons licenses
- **Zapsplat.com** - Free with registration
- **BBC Sound Effects Library** - Free for personal use
- **YouTube Audio Library** - Copyright-free sounds

### Specific Sound Recommendations:

- **Roulette Spin**: Search for "casino wheel spinning", "slot machine", or "mechanical spinning"
- **Click**: Search for "button click", "mechanical click", or "lock sound"
- **Success**: Search for "bell ring", "success chime", or "achievement sound" 
- **Victory**: Search for "fanfare", "victory tune", or "achievement fanfare"
- **Tournament Won**: Search for "grand fanfare", "celebration music", or "victory theme"

## File Format Requirements:
- Format: MP3 (recommended) or WAV
- Quality: 44.1kHz, 16-bit minimum
- Length: 
  - Roulette spin: 3-10 seconds (will loop)
  - Click: 0.1-0.5 seconds
  - Success: 1-3 seconds
  - Victory: 2-5 seconds
  - Tournament won: 3-8 seconds

## Alternative: External Sound APIs

If you prefer not to use local files, you can modify the sound URLs in `src/app/services/sound.service.ts` to point to external sound APIs or direct URLs to sound files hosted elsewhere.

## Testing Sounds

After adding the sound files, test them by:
1. Starting a tournament
2. Going through the roulette process
3. Playing matches and winning
4. Completing a tournament

The sounds should play at appropriate times during these actions.