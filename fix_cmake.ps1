$path = "node_modules\expo-gl-cpp\cpp\CMakeLists.txt"
$content = [System.IO.File]::ReadAllText($path)

# Convert content to LF for consistent searching
$content = $content.Replace("`r`n", "`n")

$search1 = @"
# Extracted AAR: `${BUILD_DIR}/react-native-0*/jni/`${ANDROID_ABI}
file(GLOB LIBRN_DIR "`$"{RN_SO_DIR}/`$"{ANDROID_ABI}")
if(NOT LIBRN_DIR)
    # If /`$"{ANDROID_ABI} dir not found, then `$"{RN_SO_DIR} is probably:
    # ReactAndroid/build/react-ndk/exported
    file(GLOB LIBRN_DIR "`$"{RN_SO_DIR}")
endif()

target_include_directories(`$"{PACKAGE_NAME}
                           PRIVATE "`$"{REACT_NATIVE_DIR}/ReactCommon/jsi")

find_library(
    JSI_LIB jsi
    PATHS `$"{LIBRN_DIR}
    NO_CMAKE_FIND_ROOT_PATH)
"@

$replace1 = "find_package(ReactAndroid REQUIRED CONFIG)"

# Normalizing search string to LF
$search1 = $search1.Replace("`r`n", "`n")

if ($content.Contains($search1)) {
    $content = $content.Replace($search1, $replace1)
    Write-Host "Replaced library finding logic."
} else {
    Write-Host "Could not find block 1. Content might vary."
}

$search2 = 'target_link_libraries(${PACKAGE_NAME} ${JSI_LIB} ${LOG_LIB} ${GLES_LIB} android)'
$replace2 = 'target_link_libraries(${PACKAGE_NAME} ReactAndroid::jsi ${LOG_LIB} ${GLES_LIB} android)'

if ($content.Contains($search2)) {
    $content = $content.Replace($search2, $replace2)
    Write-Host "Updated target_link_libraries."
} else {
    Write-Host "Could not find block 2."
}

[System.IO.File]::WriteAllText($path, $content)
