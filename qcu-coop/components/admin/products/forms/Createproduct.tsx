"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useForm, useFieldArray, Controller, FieldName } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";
import Image from "next/image";

import { ProductSchema } from "@/middleware/zod/products";
import { createProduct } from "@/lib/api/products";
import { getAllCategories } from "@/lib/api/categories";
import Permission from "../../Permission";
import { rolePermissions } from "@/lib/permission";
import { useToast } from "@/components/ui/use-toast";
import { createActivity } from "@/lib/api/activity";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Categories } from "@/types/products/products";

type ValidationProduct = z.infer<typeof ProductSchema>;
type SelectedImage = {
  image: File | null;
  albums: File[] | [];
};

type ImageNumber = {
  image: number;
  albums: number;
};

const steps = [
  {
    step: 1,
    name: "Product Information",
    fields: [
      "product_name",
      "display_name",
      "display_price",
      "product_description",
      "status",
      "isFeatured",
      "category_id",
      "display_image",
      "product_album",
    ],
  },
  { step: 2, name: "Variants", fields: ["variants"] },
];

const CreateProductForm = () => {
  const { toast } = useToast();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { moderate } = rolePermissions;
  const [categories, setCategories] = useState<Categories[] | null>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [adminId, setAdminId] = useState<number>(0);

  const [selectedImage, setSelectedImage] = useState<SelectedImage>({
    image: null,
    albums: [],
  });
  const [imageNumber, setImageNumber] = useState<ImageNumber>({
    image: 0,
    albums: 0,
  });
  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ValidationProduct>({
    resolver: zodResolver(ProductSchema),
  });
  const { fields, append, remove } = useFieldArray({
    name: "variants",
    control,
  });
  useEffect(() => {
    const getCategories = async () => {
      const getCategories = await getAllCategories();
      if (!getCategories || getCategories.length === 0)
        return setCategories(null);
      setCategories(getCategories);
      if (fields.length === 0) {
        append({
          variant_name: "",
          variant_symbol: "",
          variant_price: "0",
          variant_stocks: 0,
        });
      }
    };
    getCategories();
  }, []);

  const handlePermission = async (permission: boolean, id?: number) => {
    if (permission) {
      setIsAllowed(true);
      id && setAdminId(id);
    }
    !isAllowed && buttonRef.current && buttonRef.current.click();
  };

  type FieldName = keyof ValidationProduct;
  const next = async () => {
    if (currentStep < steps.length) {
      const fields = steps[currentStep - 1].fields;
      const validate = await trigger(fields as FieldName[], {
        shouldFocus: true,
      });
      validate && setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePrevNext = (action: string) => {
    if (action === "next") return next();
    return prev();
  };
  const onSubmit = async (data: ValidationProduct) => {
    const { product_name } = data;
    if (isAllowed) {
      const form = new FormData();
      const { variants, product_album, ...newData } = data;
      for (const key of Object.keys(newData) as (keyof typeof newData)[]) {
        form.append(key, newData[key]);
      }
      form.append("variants", JSON.stringify(variants));
      if (product_album) {
        for (const file of product_album) {
          form.append("product_album", file);
        }
      }
      try {
        const response = await createProduct(form);
        if (response.status === 201) {
          await createActivity(
            {
              action: "created",
              target: "product",
              object: product_name,
            },
            adminId
          );
          toast({
            description: `You have successfully created ${product_name} product.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Failed to Create Product.",
            description: `${response.data.message}`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Internal Server Error.",
          description: `Something went wrong.`,
        });
      }
    }
  };

  useEffect(() => {
    if (isAllowed) {
      handleSubmit(onSubmit)();
      setIsAllowed(false);
    }
  }, [isAllowed]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative grid grid-cols-2 w-full h-full overflow-y-auto"
    >
      {currentStep === 1 && (
        <>
          <div id="first-section" className="p-5 flex flex-col space-y-5">
            <Label className="font-bold">Images / Albums</Label>
            <div id="image-container" className="flex space-x-2">
              <div id="product-image-preview">
                <Dialog>
                  <DialogTrigger
                    className={classNames({
                      "bg-inputColor border border-black w-24 h-24 cursor-default":
                        true,
                      "cursor-pointer": selectedImage.image,
                    })}
                  >
                    {selectedImage.image && (
                      <div
                        id="preview-image-container"
                        className="relative w-full h-full"
                      >
                        <Image
                          src={URL.createObjectURL(selectedImage.image)}
                          alt="Selected Image"
                          sizes="min-w-1"
                          className="object-contain"
                          fill
                        />
                      </div>
                    )}
                  </DialogTrigger>
                  {selectedImage.image && (
                    <DialogContent>
                      <AspectRatio ratio={10 / 10} className="absolute">
                        <Image
                          src={URL.createObjectURL(selectedImage.image)}
                          alt="Selected Image"
                          sizes="min-w-1"
                          fill
                          className="rounded-lg object-contain"
                        />
                      </AspectRatio>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
              <div id="product-album-preview">
                <Dialog>
                  <DialogTrigger
                    className={classNames({
                      "bg-inputColor border border-black w-24 h-24 cursor-default":
                        true,
                      "cursor-pointer": selectedImage.albums.length > 0,
                    })}
                  >
                    {selectedImage.albums[0] && (
                      <div
                        id="preview-image-container"
                        className="relative w-full h-full"
                      >
                        <Image
                          src={URL.createObjectURL(selectedImage.albums[0])}
                          alt="Selected Image"
                          sizes="min-w-1"
                          className="object-contain"
                          fill
                        />
                      </div>
                    )}
                  </DialogTrigger>
                  {selectedImage.albums && (
                    <DialogContent className="flex justify-center items-center">
                      <div
                        className={classNames({
                          "w-full h-[500px] gap-1 overflow-y-auto flex flex-wrap":
                            true,
                          "grid grid-cols-2": selectedImage.albums.length >= 4,
                        })}
                      >
                        {selectedImage.albums.map((album, index) => (
                          <AspectRatio ratio={1 / 1} key={index} className="">
                            <Image
                              src={URL.createObjectURL(album)}
                              alt="Selected Image"
                              sizes="min-w-1"
                              fill
                              className="rounded-lg object-contain"
                            />
                          </AspectRatio>
                        ))}
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
              <div className="flex space-x-2">
                <div className="flex flex-col">
                  <Label
                    htmlFor="display_image"
                    className={classNames({
                      "border-red-600": errors.display_image,
                      "border-black": errors.display_image === undefined,
                      "bg-inputColor border hover:cursor-pointer w-24 h-24 flex flex-col justify-center items-center":
                        true,
                    })}
                  >
                    <div id="add-icon-container" className="relative w-10 h-10">
                      <Image
                        src="/icons/add-image-icon.svg"
                        alt="add-image-icon"
                        sizes="min-w-1"
                        fill
                      />
                    </div>
                    <p>Add Image</p>
                    <p>{imageNumber.image}/1</p>
                  </Label>
                  <Controller
                    name="display_image"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <>
                        <Input
                          {...field}
                          onChange={(event) => {
                            const selectedFile = event.target.files;
                            if (selectedFile) {
                              const imageFile = selectedFile[0];
                              onChange(imageFile);
                              setSelectedImage((prevFiles) => ({
                                ...prevFiles,
                                image: imageFile,
                              }));
                              setImageNumber((prevCount) => ({
                                ...prevCount,
                                image: selectedFile.length,
                              }));
                            }
                          }}
                          type="file"
                          id="display_image"
                          className={classNames({
                            "border-red-600": errors.display_image,
                            hidden: true,
                          })}
                        />
                      </>
                    )}
                  />
                  {errors.display_image && (
                    <p className="text-red-600 text-sm mt-2">
                      <>{errors.display_image?.message}</>
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  <Label
                    htmlFor="product_album"
                    className={classNames({
                      "border-red-600": errors.product_album,
                      "border-black": errors.product_album === undefined,
                      "bg-inputColor border hover:cursor-pointer w-24 h-24 flex flex-col justify-center items-center":
                        true,
                    })}
                  >
                    <div id="add-icon-container" className="relative w-10 h-10">
                      <Image
                        src="/icons/add-image-icon.svg"
                        alt="add-image-icon"
                        sizes="min-w-1"
                        fill
                      />
                    </div>
                    <p>Add Albums</p>
                    <p>{imageNumber.albums}/10</p>
                  </Label>
                  <Controller
                    name="product_album"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <>
                        <Input
                          {...field}
                          onChange={(event) => {
                            const selectedFile = event.target.files;
                            if (selectedFile) {
                              const albumFiles = Array.from(selectedFile);
                              onChange(albumFiles);
                              setSelectedImage((prevFiles) => ({
                                ...prevFiles,
                                albums: albumFiles,
                              }));
                              setImageNumber((prevCount) => ({
                                ...prevCount,
                                ["albums"]: selectedFile.length,
                              }));
                            }
                          }}
                          type="file"
                          id="product_album"
                          multiple
                          className={classNames({
                            "border-red-600": errors.product_album,
                            hidden: true,
                          })}
                        />
                      </>
                    )}
                  />
                  {errors.product_album && (
                    <p className="text-red-600 text-sm mt-2">
                      <>{errors.product_album?.message}</>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex w-full space-x-5 items-center">
                <Label htmlFor="product_name" className="font-bold">
                  Name
                </Label>
                <Input
                  {...register("product_name")}
                  id="product_name"
                  placeholder="Product Name"
                  autoComplete="off"
                  className={classNames({
                    "border-black": errors.product_name === undefined,
                    "border-red-600": errors.product_name,
                    "bg-inputColor": true,
                  })}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex w-full space-x-5 items-center">
                <Label
                  htmlFor="display_name"
                  className="font-bold whitespace-nowrap"
                >
                  Display Name
                </Label>
                <Input
                  {...register("display_name")}
                  id="display_name"
                  placeholder="Display Name"
                  autoComplete="off"
                  className={classNames({
                    "border-black": errors.display_name === undefined,
                    "border-red-600": errors.display_name,
                    "bg-inputColor ": true,
                  })}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex w-full space-x-5 items-center">
                <Label
                  htmlFor="display_price"
                  className="font-bold whitespace-nowrap"
                >
                  Display Price
                </Label>
                <Input
                  {...register("display_price")}
                  id="display_price"
                  placeholder="Display Price"
                  autoComplete="off"
                  className={classNames({
                    "border-black": errors.display_price === undefined,
                    "border-red-600": errors.display_price,
                    "bg-inputColor": true,
                  })}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex w-full space-x-5 items-center">
                <Label htmlFor="category_id" className="font-bold">
                  Category
                </Label>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="category_id"
                          className={classNames({
                            "border-black": errors.category_id === undefined,
                            "border-red-600": errors.category_id,
                            "bg-inputColor w-1/2": true,
                          })}
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectGroup>
                            {!categories && (
                              <SelectLabel>No Categories</SelectLabel>
                            )}
                            {categories &&
                              categories.length > 0 &&
                              categories.map((category, index) => (
                                <SelectItem
                                  value={`${String(category.category_id)}`}
                                  key={index}
                                >
                                  {category.category_name}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
            </div>
          </div>

          <div id="second-section" className="p-5 flex flex-col space-y-5">
            <div className="flex flex-col">
              <div className="flex w-full space-x-5 items-center">
                <Label htmlFor="status" className="font-bold">
                  Status
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <Select onValueChange={onChange} value={value}>
                        <SelectTrigger
                          id="status"
                          className={classNames({
                            "border-black": errors.status === undefined,
                            "border-red-600": errors.status,
                            "bg-inputColor w-1/2": true,
                          })}
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex w-full space-x-5 items-center">
                <Label htmlFor="isFeatured" className="font-bold">
                  Featured
                </Label>
                <Controller
                  name="isFeatured"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="isFeatured"
                          className={classNames({
                            "border-black": errors.isFeatured === undefined,
                            "border-red-600": errors.isFeatured,
                            "bg-inputColor w-1/2 relative": true,
                          })}
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="1">Yes</SelectItem>
                          <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:space-x-10">
              <div className="flex w-full space-x-5 items-center">
                <Label htmlFor="product_description" className="font-bold">
                  Description
                </Label>
                <Textarea
                  {...register("product_description")}
                  id="product_description"
                  placeholder="Description"
                  autoComplete="off"
                  className={classNames({
                    "border-black": errors.product_description === undefined,
                    "border-red-600": errors.product_description,
                    "bg-inputColor max-h-52": true,
                  })}
                />
              </div>

              {errors.product_description && (
                <p className="text-red-600 text-sm mt-1 text-center">
                  <>{errors.product_description?.message}</>
                </p>
              )}
            </div>
          </div>
          <Button
            variant="system"
            type="button"
            onClick={() => handlePrevNext("next")}
            className=" absolute right-0 bottom-0 w-[12%] flex justify-center items-center"
          >
            <p className="text-lg">Next</p>
            <div className="absolute right-6 w-5 h-5">
              <Image
                src="/icons/right-chevron-icon.svg"
                alt="right-chevron"
                sizes="min-w-1"
                fill
              />
            </div>
          </Button>
        </>
      )}

      {currentStep === 2 && (
        <>
          <div
            id="variant-container"
            className="grid grid-cols-2 bg-[#37B3E2] overflow-auto"
          >
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 flex flex-col space-y-3">
                <div className="flex items-center space-x-5">
                  <Label htmlFor={`variants.${index}.variant_name`}>Name</Label>
                  <div className="w-full">
                    <Input
                      {...register(`variants.${index}.variant_name` as const)}
                      id={`variants${index}.variant_name`}
                      autoComplete="off"
                      className={classNames({
                        "border-red-600":
                          errors.variants &&
                          errors.variants[index]?.variant_name,
                      })}
                    />
                    {errors.variants && (
                      <p className="text-red-600 text-sm text-center">
                        <>{errors.variants[index]?.variant_name?.message}</>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-5">
                  <Label htmlFor={`variants.${index}.variant_symbol`}>
                    Symbol
                  </Label>
                  <div className="w-full">
                    <Input
                      {...register(`variants.${index}.variant_symbol` as const)}
                      id={`variants.${index}.variant_symbol`}
                      autoComplete="off"
                      className={classNames({
                        "border-red-600":
                          errors.variants &&
                          errors.variants[index]?.variant_symbol,
                        "": true,
                      })}
                    />
                    {errors.variants && (
                      <p className="text-red-600 text-sm text-center">
                        <>{errors.variants[index]?.variant_symbol?.message}</>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-5">
                  <Label
                    htmlFor={`variants.${index}.variant_price`}
                    className="text-right"
                  >
                    Price
                  </Label>
                  <div className="w-full">
                    <Input
                      {...register(`variants.${index}.variant_price` as const)}
                      type="number"
                      id={`variants.${index}.variant_price`}
                      autoComplete="off"
                      className={classNames({
                        "border-red-600":
                          errors.variants &&
                          errors.variants[index]?.variant_price,
                        "": true,
                      })}
                    />
                    {errors.variants && (
                      <p className="text-red-600 text-sm mt-2">
                        <>{errors.variants[index]?.variant_price?.message}</>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-5">
                  <Label
                    htmlFor={`variants.${index}.variant_stocks`}
                    className="text-right"
                  >
                    Stocks
                  </Label>
                  <div className="w-full">
                    <Input
                      {...register(
                        `variants.${index}.variant_stocks` as const,
                        { valueAsNumber: true }
                      )}
                      type="number"
                      max={125}
                      min={0}
                      id={`variants.${index}.variant_stocks`}
                      autoComplete="off"
                      className={classNames({
                        "border-red-600":
                          errors.variants &&
                          errors.variants[index]?.variant_stocks,
                        "": true,
                      })}
                    />
                    {errors.variants && (
                      <p className="text-red-600 text-sm mt-2">
                        <>{errors.variants[index]?.variant_stocks?.message}</>
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => {
                    fields.length > 1
                      ? remove(index)
                      : toast({
                          variant: "destructive",
                          title: "Failed to remove variant.",
                          description: "There must be atleast 1 variant.",
                        });
                  }}
                >
                  REMOVE
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="system"
            type="button"
            onClick={() =>
              append({
                variant_name: "",
                variant_symbol: "",
                variant_price: "0",
                variant_stocks: 0,
              })
            }
            className="absolute right-10 top-2"
          >
            Add Variant
          </Button>
          <Button
            variant="system"
            type="button"
            onClick={() => handlePrevNext("prev")}
            className="absolute left-0 bottom-0 w-[12%] flex justify-center items-center"
          >
            <div className="absolute left-6 w-5 h-5">
              <Image
                src="/icons/left-chevron-icon.svg"
                alt="left-chevron"
                sizes="min-w-1"
                fill
              />
            </div>
            <p className="text-lg">Prev</p>
          </Button>
          <Dialog>
            <DialogTrigger className="h-fit w-fit">
              <Button
                ref={buttonRef}
                variant="system"
                type="button"
                className="absolute right-0 bottom-0 w-[14%] flex space-x-3 "
              >
                <div className="relative w-5 h-5 float-left">
                  <Image
                    src="/icons/add-sign-icon.svg"
                    alt="add-sign"
                    sizes="min-w-1"
                    fill
                  />
                </div>
                <p className="text-lg whitespace-nowrap">
                  {isSubmitting ? "Publishing Item" : "Publish Item"}
                </p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Permission
                roles={moderate}
                handlePermission={handlePermission}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </form>
  );
};

export default CreateProductForm;
