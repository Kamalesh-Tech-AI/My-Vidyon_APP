import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
    const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();

    const currentLangObj = supportedLanguages.find(lang => lang.code === currentLanguage);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 border-primary/20 bg-primary/5 hover:bg-primary/10">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline font-medium text-primary">{currentLangObj?.nativeName}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {supportedLanguages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onSelect={() => {
                            console.log('Language selected:', lang.code);
                            changeLanguage(lang.code);
                        }}
                        className={cn(
                            "cursor-pointer flex items-center justify-between",
                            currentLanguage === lang.code && "bg-primary/10 font-semibold"
                        )}
                    >
                        <span>{lang.nativeName}</span>
                        {currentLanguage === lang.code && (
                            <Check className="w-4 h-4 text-primary ml-2" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
