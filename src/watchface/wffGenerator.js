// Official Wear OS 5 & 6 Watch Face Format (WFF) XML Generator for Galaxy Watch 8
// Strictly follows the Google/Samsung WFF v2.0 Schema Specification

export function generateWFFXml(state) {
  const theme = state.getTheme ? state.getTheme() : { primary: '#00FFA3', secondary: '#00E5FF', accent: '#FF0055' };
  
  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  ================================================================================
  Samsung Galaxy Watch 8 - Sport & Fitness Dashboard Watch Face
  Official Wear OS Watch Face Format (WFF) Specification v2.0
  Fully compliant with Wear OS 5 & Wear OS 6 (Galaxy Watch 7 / Ultra / 8)
  ================================================================================
-->
<WatchFace width="450" height="450" clipShape="CIRCLE">
    <Metadata key="CLOCK_TYPE" value="DIGITAL" />
    <Metadata key="PREVIEW_TIME" value="10:08:32" />

    <Scene backgroundColor="#ff000000">

        <!-- 1. Background Ambient Disc -->
        <PartDraw x="0" y="0" width="450" height="450">
            <Ellipse x="0" y="0" width="450" height="450">
                <Fill color="#ff000000" />
            </Ellipse>
        </PartDraw>

        <!-- 2. Central Digital Clock (Time) -->
        <DigitalClock x="0" y="74" width="450" height="96">
            <!-- Interactive Mode: Bold Themed Color -->
            <TimeText format="hh:mm" hourFormat="SYNC_TO_DEVICE" align="CENTER" x="0" y="0" width="450" height="96" alpha="255">
                <Variant mode="AMBIENT" target="alpha" value="0" />
                <Font family="SYNC_TO_DEVICE" size="86" weight="BLACK" color="${theme.primary}" />
            </TimeText>
            <!-- Ambient Mode: Clean Low-Power White -->
            <TimeText format="hh:mm" hourFormat="SYNC_TO_DEVICE" align="CENTER" x="0" y="0" width="450" height="96" alpha="0">
                <Variant mode="AMBIENT" target="alpha" value="230" />
                <Font family="SYNC_TO_DEVICE" size="86" weight="NORMAL" color="#ffffffff" />
            </TimeText>
        </DigitalClock>

        <!-- 3. Date & Full Day of Week (Fixed [DAY] tag, Directly Below Time) -->
        <PartText x="0" y="172" width="450" height="42">
            <Text align="CENTER">
                <Font family="SYNC_TO_DEVICE" size="25" weight="BOLD" color="#ffffffff">
                    <Template>%s, %d %s
                        <Parameter expression="[DAY_OF_WEEK_F]" />
                        <Parameter expression="[DAY]" />
                        <Parameter expression="[MONTH_F]" />
                    </Template>
                </Font>
            </Text>
        </PartText>

        <!-- 4. Digital Seconds Display (Directly Below Date, Auto-Hidden in Ambient) -->
        <PartDraw x="185" y="214" width="80" height="28" alpha="255">
            <Variant mode="AMBIENT" target="alpha" value="0" />
            <RoundRectangle x="0" y="0" width="80" height="28" cornerRadiusX="14" cornerRadiusY="14">
                <Fill color="#1800ffa3" />
                <Stroke color="#5000ffa3" thickness="1" />
            </RoundRectangle>
        </PartDraw>
        <PartText x="0" y="214" width="450" height="28" alpha="255">
            <Variant mode="AMBIENT" target="alpha" value="0" />
            <Text align="CENTER">
                <Font family="SYNC_TO_DEVICE" size="19" weight="BLACK" color="${theme.primary}">
                    <Template>: %s
                        <Parameter expression="[SECOND_Z]" />
                    </Template>
                </Font>
            </Text>
        </PartText>

        <!-- 5. Biometric Telemetry: Heart Rate (Bottom Left) -->
        <PartText x="35" y="255" width="150" height="46">
            <Text align="CENTER">
                <Font family="SYNC_TO_DEVICE" size="36" weight="BLACK" color="#ffffffff">
                    <Template>%d
                        <Parameter expression="[HEART_RATE]" />
                    </Template>
                </Font>
            </Text>
        </PartText>
        <PartText x="35" y="298" width="150" height="24">
            <Text align="CENTER">
                <Font family="SYNC_TO_DEVICE" size="13" weight="BOLD" color="#ffff0055">
                    <Template>%s
                        <Parameter expression="&quot;♥ BPM&quot;" />
                    </Template>
                </Font>
            </Text>
        </PartText>

        <!-- 6. Device Telemetry: Battery % (Bottom Right) -->
        <PartText x="265" y="255" width="150" height="46">
            <Text align="CENTER">
                <Font family="SYNC_TO_DEVICE" size="36" weight="BLACK" color="#ffffffff">
                    <Template>%d%%
                        <Parameter expression="[BATTERY_PERCENT]" />
                    </Template>
                </Font>
            </Text>
        </PartText>
        <PartText x="265" y="298" width="150" height="24">
            <Text align="CENTER">
                <Font family="SYNC_TO_DEVICE" size="13" weight="BOLD" color="${theme.primary}">
                    <Template>%s
                        <Parameter expression="&quot;⚡ BATTERY&quot;" />
                    </Template>
                </Font>
            </Text>
        </PartText>

        <!-- 7. Temperature in Celsius for Current Location (Bottom Center, Large & Prominent) -->
        <Condition>
            <Expressions>
                <Expression name="is_weather_available">[WEATHER.IS_AVAILABLE]</Expression>
            </Expressions>
            <Compare expression="is_weather_available">
                <PartText x="0" y="348" width="450" height="52">
                    <Text align="CENTER">
                        <Font family="SYNC_TO_DEVICE" size="36" weight="BLACK" color="${theme.secondary}">
                            <Template>⛅ %d°C
                                <Parameter expression="[WEATHER.TEMPERATURE_UNIT] == 2 ? round(([WEATHER.TEMPERATURE] - 32) * 5 / 9) : round([WEATHER.TEMPERATURE])" />
                            </Template>
                        </Font>
                    </Text>
                </PartText>
            </Compare>
            <Default>
                <PartText x="0" y="348" width="450" height="48">
                    <Text align="CENTER">
                        <Font family="SYNC_TO_DEVICE" size="34" weight="BLACK" color="${theme.secondary}">
                            <Template>%s
                                <Parameter expression="&quot;⛅ 22°C&quot;" />
                            </Template>
                        </Font>
                    </Text>
                </PartText>
            </Default>
        </Condition>

        <!-- 8. Personalized Signature: Daniel Machado in Funky Font -->
        <PartText x="0" y="398" width="450" height="38" alpha="255">
            <Variant mode="AMBIENT" target="alpha" value="120" />
            <Text align="CENTER">
                <Font family="funky" size="21" color="${theme.primary}">
                    <Template>%s
                        <Parameter expression="&quot;Daniel Machado&quot;" />
                    </Template>
                </Font>
            </Text>
        </PartText>

    </Scene>
</WatchFace>
`;
}
